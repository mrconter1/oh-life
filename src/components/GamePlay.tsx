"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitScore } from "@/lib/supabase";

// Define the available letters
const LETTERS = [
  "b", "c", "d", "e", 
  "f", "g", "h", "k", "m",
  "n", "p", "r", "s", "t",
  "w", "x", "y", "z"
] as const;
type LetterType = typeof LETTERS[number];

// Define the circle type
type Circle = {
  id: number;
  letter: LetterType;
  x: number;
  y: number;
  feedback?: "correct" | "incorrect"; // Visual feedback state
};

// Base size of each circle (diameter in pixels)
const BASE_CIRCLE_SIZE = 48;
// Minimum circle size for small screens
const MIN_CIRCLE_SIZE = 36;
// Minimum distance between circle centers to prevent overlap (calculated dynamically)
const MIN_DISTANCE_MULTIPLIER = 1.2; // Multiplier of circle size
// Number of circles to display per round
const CIRCLES_PER_ROUND = 15;
// Duration of feedback animation in milliseconds
const FEEDBACK_DURATION = 300;
// Percentage of viewport to use for circle generation
const PLAY_AREA_WIDTH_PERCENT = 0.85;
// Safe area from edges (percentage of viewport)
const EDGE_SAFE_AREA = 0.05;

// Text-to-speech function to read out a letter
const speakLetter = (letter: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(letter);
    
    // Use a clear voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    // Set properties for better clarity
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 0.5; // Set volume to 50% as specified
    
    // Speak the letter
    window.speechSynthesis.speak(utterance);
    
    // Fallback in case speech doesn't trigger
    let hasSpeechStarted = false;
    
    utterance.onstart = () => {
      hasSpeechStarted = true;
    };
    
    // Check if speech started after a short delay, and retry if it didn't
    setTimeout(() => {
      if (!hasSpeechStarted) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }, 100);
  }
};

// Generate a random number between min and max
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

type GamePlayProps = {
  username?: string;
  onGameOver?: (score: number) => void;
};

export function GamePlay({ }: GamePlayProps = {}) {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [targetLetter, setTargetLetter] = useState<LetterType | null>(null);
  const [score, setScore] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [processingClick, setProcessingClick] = useState(false);
  const [preparingNewRound, setPreparingNewRound] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRoundButtonDisabled, setNewRoundButtonDisabled] = useState(false);

  // Calculate responsive circle size based on screen width
  const circleSize = useMemo(() => {
    if (width === 0) return BASE_CIRCLE_SIZE;
    
    // For smaller screens, reduce circle size (min 36px)
    if (width < 480) {
      return MIN_CIRCLE_SIZE;
    } else if (width < 768) {
      return BASE_CIRCLE_SIZE - 4; // 44px
    } else {
      return BASE_CIRCLE_SIZE;
    }
  }, [width]);

  // Calculate minimum distance based on circle size
  const minDistance = useMemo(() => {
    return circleSize * MIN_DISTANCE_MULTIPLIER;
  }, [circleSize]);

  // Check if a new position would overlap with existing circles
  const wouldOverlap = useCallback((x: number, y: number, existingCircles: Circle[]): boolean => {
    for (const circle of existingCircles) {
      // Calculate distance between centers
      const distance = Math.sqrt(
        Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2)
      );
      // If distance is less than minimum, they overlap
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  }, [minDistance]);

  // Generate a valid, non-overlapping position for a circle
  const generateValidPosition = useCallback((existingCircles: Circle[], totalWidth: number, totalHeight: number): { x: number; y: number } => {
    // Calculate the play area dimensions
    const playAreaWidth = totalWidth * PLAY_AREA_WIDTH_PERCENT;
    // Adjust height to avoid top and bottom areas where UI elements are
    const playAreaHeight = totalHeight * 0.7; // 70% of screen height
    
    // Calculate offsets to center the play area
    const offsetX = (totalWidth - playAreaWidth) / 2;
    // Offset Y to avoid top area with controls
    const offsetY = totalHeight * 0.15;
    
    // Create safe boundaries for placing circles (avoid edges)
    const safeAreaX = totalWidth * EDGE_SAFE_AREA;
    const safeAreaY = totalHeight * EDGE_SAFE_AREA;
    
    // Set boundaries for placing circles
    const minX = offsetX + Math.max(circleSize / 2, safeAreaX);
    const maxX = offsetX + playAreaWidth - Math.max(circleSize / 2, safeAreaX);
    const minY = offsetY + Math.max(circleSize / 2, safeAreaY);
    const maxY = offsetY + playAreaHeight - Math.max(circleSize / 2, safeAreaY);
    
    // Max attempts to find a valid position
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const x = randomNumber(minX, maxX);
      const y = randomNumber(minY, maxY);
      
      if (!wouldOverlap(x, y, existingCircles)) {
        return { x, y };
      }
      
      attempts++;
    }
    
    // If we can't find a valid position after max attempts, use a grid position
    // This is a fallback to ensure we don't get stuck in an infinite loop
    const gridSize = Math.ceil(Math.sqrt(existingCircles.length + 1)) + 1;
    const cellWidth = (maxX - minX) / gridSize;
    const cellHeight = (maxY - minY) / gridSize;
    
    // Find an empty cell in a grid pattern
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = minX + col * cellWidth + cellWidth / 2;
        const y = minY + row * cellHeight + cellHeight / 2;
        
        if (!wouldOverlap(x, y, existingCircles)) {
          return { x, y };
        }
      }
    }
    
    // Last resort: return a position with some jitter, accepting potential overlap
    return {
      x: randomNumber(minX, maxX),
      y: randomNumber(minY, maxY),
    };
  }, [circleSize, wouldOverlap]);

  // Generate new circles and set a new target
  const generateNewRound = useCallback(() => {
    if (!gameActive || preparingNewRound) return;
    
    // Set preparing flag immediately to prevent multiple generations
    setPreparingNewRound(true);
    
    // Shuffle all available letters
    const shuffledLetters = shuffleArray([...LETTERS]);
    
    // Take the first N letters for this round
    const selectedLetters = shuffledLetters.slice(0, CIRCLES_PER_ROUND);
    
    // Create circles with non-overlapping positions
    const newCircles: Circle[] = [];
    
    selectedLetters.forEach((letter, index) => {
      const { x, y } = generateValidPosition(newCircles, width, height);
      newCircles.push({
        id: index,
        letter,
        x,
        y,
      });
    });
    
    // Set a random target from the available circles
    const targetIndex = Math.floor(Math.random() * newCircles.length);
    const targetCircle = newCircles[targetIndex];
    
    // Set everything at once for faster rendering
    setCircles(newCircles);
    
    // Small delay before setting the target letter and speaking
    setTimeout(() => {
      setTargetLetter(targetCircle.letter);
      setPreparingNewRound(false);
      
      // Speak the letter once the target is set
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Add a small delay before speaking to ensure the speech synthesis is ready
        setTimeout(() => {
          speakLetter(targetCircle.letter);
        }, 50);
      }
    }, 100);
  }, [width, height, gameActive, preparingNewRound, generateValidPosition]);

  // Initialize the game
  useEffect(() => {
    // Initialize and load voices if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Load voices for Safari
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      
      loadVoices();
      
      // Safari and some browsers need this event to get the voices
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    const updateDimensions = () => {
      // Use window dimensions instead of container dimensions
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Update dimensions and add event listener
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Start the game when dimensions are set and it's the initial render
    // Use a ref to track if the initial round has been generated
    const isInitialRender = circles.length === 0 && !preparingNewRound;
    if (width > 0 && height > 0 && isInitialRender && gameActive) {
      generateNewRound();
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [width, height, generateNewRound, circles.length, preparingNewRound, gameActive]);

  // Start new round after clearing previous one
  const startNewRound = useCallback((scoreIncrement = 0) => {
    // If already preparing a new round, don't start another one
    if (preparingNewRound) return;
    
    // Cancel any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Mark that we're preparing a new round to prevent race conditions
    setPreparingNewRound(true);
    
    // Clear all circles and target letter first to stop any ongoing animations
    setCircles([]);
    setTargetLetter(null);
    
    // Update score if needed
    if (scoreIncrement > 0) {
      setScore(prev => prev + scoreIncrement);
    }
    
    // Shorter delay to reduce blank screen time
    setTimeout(() => {
      setProcessingClick(false);
      // Don't need to call setPreparingNewRound(true) again here
      // since generateNewRound now sets it immediately
      generateNewRound();
    }, 100); // Reduced from 300ms to 100ms
  }, [generateNewRound, preparingNewRound]);

  // Handle manual new round request - separate from automatic round generation
  const handleNewRound = () => {
    if (processingClick || preparingNewRound) return;
    
    // Only disable the New Round button when manually clicked
    setNewRoundButtonDisabled(true);
    startNewRound(0);
    
    // Re-enable the button after the round is generated
    setTimeout(() => {
      setNewRoundButtonDisabled(false);
    }, 350); // Slightly longer than the animation duration
  };

  // Handle automatic round generation after a click (correct or incorrect)
  // This avoids animation of the New Round button
  const startAutomaticNewRound = useCallback((scoreIncrement = 0) => {
    // If already preparing a new round, don't start another one
    if (preparingNewRound) return;
    
    // Cancel any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Mark that we're preparing a new round to prevent race conditions
    setPreparingNewRound(true);
    
    // Clear all circles and target letter first to stop any ongoing animations
    setCircles([]);
    setTargetLetter(null);
    
    // Update score if needed
    if (scoreIncrement > 0) {
      setScore(prev => prev + scoreIncrement);
    }
    
    // Shorter delay to reduce blank screen time
    setTimeout(() => {
      setProcessingClick(false);
      generateNewRound();
    }, 100);
  }, [generateNewRound, preparingNewRound]);

  // Handle speaking the current target letter
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSpeakLetter = () => {
    if (targetLetter) {
      speakLetter(targetLetter);
    }
  };

  // Handle click on a circle
  const handleCircleClick = (circle: Circle) => {
    if (!gameActive || processingClick || preparingNewRound || !targetLetter) return;
    
    // Update circles with appropriate feedback
    setProcessingClick(true);
    
    // Don't speak the clicked letter anymore
    
    if (circle.letter === targetLetter) {
      // Correct choice - show green feedback
      setCircles(prevCircles => 
        prevCircles.map(c => 
          c.id === circle.id ? { ...c, feedback: "correct" } : c
        )
      );
      
      // Wait for the animation to complete
      setTimeout(() => {
        startAutomaticNewRound(1); // Start new round with +1 score
      }, FEEDBACK_DURATION);
    } else {
      // Incorrect choice - show red feedback
      setCircles(prevCircles => 
        prevCircles.map(c => 
          c.id === circle.id ? { ...c, feedback: "incorrect" } : c
        )
      );
      
      // Wait for the animation to complete, then generate new round without adding score
      setTimeout(() => {
        startAutomaticNewRound(0); // Start new round with no score increase
      }, FEEDBACK_DURATION);
    }
  };

  // Handle showing submit form
  const handleShowSubmitForm = () => {
    setGameActive(false);
    setShowSubmitForm(true);
  };

  // Handle submitting the game
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setSubmitError(true);
      return;
    }
    
    // Loading state while submitting
    setSubmitting(true);
    
    try {
      // Submit the score to Supabase
      const { success, error } = await submitScore(playerName.trim(), score);
      
      if (!success) {
        throw new Error(error || "Failed to submit score");
      }
      
      // Return to the main menu on success
      router.push("/");
    } catch (error) {
      console.error("Error submitting score:", error);
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle showing exit confirmation
  const handleShowExitConfirmation = () => {
    setShowExitConfirmation(true);
  };

  // Handle confirming exit to main menu
  const handleConfirmExit = () => {
    router.push("/");
  };

  // Handle canceling exit
  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  // Handle canceling score submission
  const handleSkipSubmit = () => {
    setShowSubmitForm(false);
  };

  // Get the feedback styles based on feedback state
  const getFeedbackStyles = (feedback?: "correct" | "incorrect") => {
    // Base styles
    const styles: React.CSSProperties = {};
    
    if (feedback === "correct") {
      styles.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.9)';
    } else if (feedback === "incorrect") {
      styles.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.9)';
    }
    
    return styles;
  };

  return (
    <div className="h-screen w-full overflow-hidden relative bg-gradient-to-b from-background to-muted">
      {/* Full viewport game area */}
      <div className="absolute inset-0">
        {circles.map((circle) => (
          <button
            key={circle.id}
            className="absolute rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 bg-black hover:bg-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              fontSize: `${circleSize * 0.4}px`,
              transform: `translate(-50%, -50%) scale(${1})`,
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: "2px", // Slight offset for visual centering
              transformOrigin: "center center",
              willChange: "transform, box-shadow",
              ...getFeedbackStyles(circle.feedback),
              transition: "transform 0.2s ease, box-shadow 0.3s ease"
            }}
            onMouseEnter={(e) => {
              if (!processingClick && !preparingNewRound) {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!processingClick && !preparingNewRound) {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
              }
            }}
            onClick={() => handleCircleClick(circle)}
            disabled={processingClick || preparingNewRound}
          >
            <span className="inline-flex items-center justify-center">{circle.letter}</span>
          </button>
        ))}
      </div>
      
      {/* Floating UI elements */}
      {/* Score card */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-card/90 backdrop-blur-sm shadow-md rounded-lg p-3">
        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-bold">{score}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Score</div>
        </div>
      </div>
      
      {/* Submit Score button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex gap-2 items-center">
        <Button 
          variant="default" 
          className="h-8 sm:h-10 px-3 sm:px-5 text-sm sm:text-base shadow-md cursor-pointer hover:cursor-pointer flex items-center" 
          onClick={handleShowSubmitForm}
        >
          Submit
        </Button>
        <Button 
          variant="outline" 
          className="w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full shadow-md cursor-pointer hover:cursor-pointer flex items-center justify-center" 
          onClick={handleShowExitConfirmation}
          aria-label="Return to Main Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
          </svg>
        </Button>
      </div>
      
      {/* Replay letter button at bottom left */}
      <div className="absolute bottom-8 left-4 sm:left-6 z-10">
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-md cursor-pointer hover:cursor-pointer"
          onClick={() => {
            if (targetLetter) {
              speakLetter(targetLetter);
            }
          }}
          aria-label="Repeat Letter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </Button>
      </div>
      
      {/* New Round button at bottom */}
      <div className="absolute bottom-8 right-0 left-0 flex justify-center z-10">
        <Button
          size="lg"
          className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg cursor-pointer hover:cursor-pointer"
          onClick={handleNewRound}
          disabled={newRoundButtonDisabled}
        >
          New Round
        </Button>
      </div>

      {/* Score submission form */}
      {!gameActive && showSubmitForm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 p-4">
          <Card className="w-full max-w-xs sm:max-w-sm p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Submit Your Score</h2>
            <div className="mb-6 text-center">
              <div className="text-4xl font-bold mb-1">{score}</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
            <form onSubmit={handleSubmitScore}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Your Name</Label>
                  <Input
                    id="playerName"
                    placeholder="Enter your name..."
                    value={playerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setPlayerName(e.target.value);
                      if (submitError) setSubmitError(false);
                    }}
                    className={submitError ? "border-destructive" : ""}
                    autoFocus
                  />
                  {submitError && (
                    <p className="text-sm text-destructive">Please enter your name to submit</p>
                  )}
                </div>
                
                <div className="pt-2">
                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="cursor-pointer hover:cursor-pointer" disabled={submitting}>Submit Score</Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="cursor-pointer hover:cursor-pointer"
                      onClick={handleSkipSubmit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Exit confirmation dialog */}
      {showExitConfirmation && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 p-4">
          <Card className="w-full max-w-xs sm:max-w-sm p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Return to Main Menu?</h2>
            <div className="mb-6 text-center">
              <p className="text-muted-foreground">Your current game progress will be lost.</p>
            </div>
            <div className="pt-2">
              <div className="flex flex-col gap-2">
                <Button 
                  variant="destructive" 
                  className="cursor-pointer hover:cursor-pointer"
                  onClick={handleConfirmExit}
                >
                  Yes, Exit Game
                </Button>
                <Button 
                  variant="outline" 
                  className="cursor-pointer hover:cursor-pointer"
                  onClick={handleCancelExit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 
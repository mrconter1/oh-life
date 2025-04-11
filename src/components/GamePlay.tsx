"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the available letters
const LETTERS = [
  "a", "b", "c", "d", "e", 
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

// Size of each circle (diameter in pixels)
const CIRCLE_SIZE = 48;
// Minimum distance between circle centers to prevent overlap
const MIN_DISTANCE = CIRCLE_SIZE + 8; // Add a small buffer
// Number of circles to display per round
const CIRCLES_PER_ROUND = 15;
// Duration of feedback animation in milliseconds
const FEEDBACK_DURATION = 300;
// Small delay to ensure clean transition between rounds
const TRANSITION_DELAY = 20;
// Percentage of viewport to use for circle generation
const PLAY_AREA_WIDTH_PERCENT = 0.8;
const PLAY_AREA_HEIGHT_PERCENT = 0.8;

// Generate a random number between min and max
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Check if a new position would overlap with existing circles
const wouldOverlap = (x: number, y: number, existingCircles: Circle[]): boolean => {
  for (const circle of existingCircles) {
    // Calculate distance between centers
    const distance = Math.sqrt(
      Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2)
    );
    // If distance is less than minimum, they overlap
    if (distance < MIN_DISTANCE) {
      return true;
    }
  }
  return false;
};

// Generate a valid, non-overlapping position for a circle
const generateValidPosition = (existingCircles: Circle[], totalWidth: number, totalHeight: number): { x: number; y: number } => {
  // Calculate the 80% play area
  const playAreaWidth = totalWidth * PLAY_AREA_WIDTH_PERCENT;
  const playAreaHeight = totalHeight * PLAY_AREA_HEIGHT_PERCENT;
  
  // Calculate offsets to center the play area
  const offsetX = (totalWidth - playAreaWidth) / 2;
  const offsetY = (totalHeight - playAreaHeight) / 2;
  
  // Set boundaries for placing circles
  const minX = offsetX + CIRCLE_SIZE / 2;
  const maxX = offsetX + playAreaWidth - CIRCLE_SIZE / 2;
  const minY = offsetY + CIRCLE_SIZE / 2;
  const maxY = offsetY + playAreaHeight - CIRCLE_SIZE / 2;
  
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

export function GamePlay({ username, onGameOver }: GamePlayProps = {}) {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [targetLetter, setTargetLetter] = useState<LetterType>(LETTERS[0]);
  const [score, setScore] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [processingClick, setProcessingClick] = useState(false);
  const [preparingNewRound, setPreparingNewRound] = useState(false);

  // Generate new circles and set a new target
  const generateNewRound = useCallback(() => {
    if (!gameActive || preparingNewRound) return;
    
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
    
    setCircles(newCircles);
    
    // Set a random target from the available circles
    const targetIndex = Math.floor(Math.random() * newCircles.length);
    const targetCircle = newCircles[targetIndex];
    
    setTargetLetter(targetCircle.letter);
    setPreparingNewRound(false);
  }, [width, height, gameActive, preparingNewRound]);

  // Initialize the game
  useEffect(() => {
    const updateDimensions = () => {
      // Use window dimensions instead of container dimensions
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Update dimensions and add event listener
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Start the game when dimensions are set
    if (width > 0 && height > 0) {
      generateNewRound();
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [width, height, generateNewRound]);

  // Start new round after clearing previous one
  const startNewRound = useCallback((scoreIncrement = 0) => {
    // Mark that we're preparing a new round to prevent race conditions
    setPreparingNewRound(true);
    
    // Clear all circles first to stop any ongoing animations
    setCircles([]);
    
    // Update score if needed
    if (scoreIncrement > 0) {
      setScore(prev => prev + scoreIncrement);
    }
    
    // Short delay to ensure clean transition
    setTimeout(() => {
      setProcessingClick(false);
      generateNewRound();
    }, TRANSITION_DELAY);
  }, [generateNewRound]);

  // Handle manual new round request
  const handleNewRound = () => {
    if (processingClick || preparingNewRound) return;
    startNewRound(0);
  };

  // Handle click on a circle
  const handleCircleClick = (circle: Circle) => {
    if (!gameActive || processingClick || preparingNewRound) return;
    
    // Update circles with appropriate feedback
    setProcessingClick(true);
    
    if (circle.letter === targetLetter) {
      // Correct choice - show green feedback
      setCircles(prevCircles => 
        prevCircles.map(c => 
          c.id === circle.id ? { ...c, feedback: "correct" } : c
        )
      );
      
      // Wait for the animation to complete
      setTimeout(() => {
        startNewRound(1); // Start new round with +1 score
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
        startNewRound(0); // Start new round with no score increase
      }, FEEDBACK_DURATION);
    }
  };

  // Handle submitting the game
  const handleShowSubmitForm = () => {
    setGameActive(false);
    setShowSubmitForm(true);
  };

  // Handle score submission
  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setSubmitError(true);
      return;
    }
    
    // Here you would save the score to a database
    console.log(`Submitted score: ${score} for player ${playerName}`);
    
    // Return to the main menu
    router.push("/");
  };

  // Handle canceling score submission
  const handleSkipSubmit = () => {
    router.push("/");
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
            className="absolute w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all duration-300 bg-black hover:bg-gray-800 cursor-pointer"
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
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
      <div className="absolute top-6 left-6 z-10 bg-card/90 backdrop-blur-sm shadow-md rounded-lg p-3">
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">{score}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Score</div>
        </div>
      </div>
      
      {/* Target letter instruction */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-muted/90 backdrop-blur-sm shadow-md rounded-lg px-5 py-3">
        <h2 className="text-xl font-bold">
          Find the letter{" "}
          <span className="font-bold text-3xl">{targetLetter}</span>
        </h2>
      </div>
      
      {/* Submit Score button */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          variant="default" 
          className="px-5 shadow-md" 
          onClick={handleShowSubmitForm}
        >
          Submit Score
        </Button>
      </div>
      
      {/* New Round button at bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <Button
          size="lg"
          className="px-8 py-6 text-lg shadow-lg"
          onClick={handleNewRound}
          disabled={processingClick || preparingNewRound}
        >
          New Round
        </Button>
      </div>

      {/* Score submission form */}
      {!gameActive && showSubmitForm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
          <Card className="w-80 p-6">
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
                    <Button type="submit">Submit Score</Button>
                    <Button 
                      type="button"
                      variant="outline" 
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
    </div>
  );
} 
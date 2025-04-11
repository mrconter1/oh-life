"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the available colors and letters
const COLORS = ["red", "blue", "green", "purple", "orange"] as const;
type ColorType = typeof COLORS[number];

const LETTERS = ["a", "b", "c", "d", "e"] as const;
type LetterType = typeof LETTERS[number];

// Map color names to tailwind classes
const COLOR_CLASSES: Record<ColorType, string> = {
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  purple: "bg-purple-500 hover:bg-purple-600",
  orange: "bg-orange-500 hover:bg-orange-600",
};

// Type for color/letter combination
type ColorLetterCombo = {
  color: ColorType;
  letter: LetterType;
};

// Define the circle type
type Circle = {
  id: number;
  color: ColorType;
  letter: LetterType;
  x: number;
  y: number;
};

// Size of each circle (diameter in pixels)
const CIRCLE_SIZE = 48;
// Minimum distance between circle centers to prevent overlap
const MIN_DISTANCE = CIRCLE_SIZE + 8; // Add a small buffer

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
const generateValidPosition = (existingCircles: Circle[], maxWidth: number, maxHeight: number): { x: number; y: number } => {
  // Padding from edges
  const padding = CIRCLE_SIZE / 2 + 10;
  
  // Max attempts to find a valid position
  const maxAttempts = 100;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const x = randomNumber(padding, maxWidth - padding);
    const y = randomNumber(120 + padding, maxHeight - padding); // Add 120px for header
    
    if (!wouldOverlap(x, y, existingCircles)) {
      return { x, y };
    }
    
    attempts++;
  }
  
  // If we can't find a valid position after max attempts, use a grid position
  // This is a fallback to ensure we don't get stuck in an infinite loop
  const gridSize = Math.ceil(Math.sqrt(existingCircles.length + 1)) + 1;
  const cellWidth = maxWidth / gridSize;
  const cellHeight = (maxHeight - 120) / gridSize;
  
  // Find an empty cell in a grid pattern
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * cellWidth + cellWidth / 2;
      const y = 120 + row * cellHeight + cellHeight / 2;
      
      if (!wouldOverlap(x, y, existingCircles)) {
        return { x, y };
      }
    }
  }
  
  // Last resort: return a position with some jitter, accepting potential overlap
  return {
    x: randomNumber(padding, maxWidth - padding),
    y: randomNumber(120 + padding, maxHeight - padding),
  };
};

// Generate all possible color-letter combinations
const generateAllCombinations = (): ColorLetterCombo[] => {
  const combos: ColorLetterCombo[] = [];
  
  for (const color of COLORS) {
    for (const letter of LETTERS) {
      combos.push({ color, letter });
    }
  }
  
  return combos;
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
  const [targetColor, setTargetColor] = useState<ColorType>(COLORS[0]);
  const [targetLetter, setTargetLetter] = useState<LetterType>(LETTERS[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitError, setSubmitError] = useState(false);

  // Generate new circles and set a new target
  const generateNewRound = useCallback(() => {
    if (!gameActive) return;
    
    // Generate all possible combinations
    const allCombos = generateAllCombinations();
    
    // Shuffle all combinations
    const shuffledCombos = shuffleArray(allCombos);
    
    // Determine number of circles to show (up to the maximum available combinations)
    // Make sure we don't add too many circles that won't fit well
    const maxCirclesForSpace = Math.min(
      Math.floor((width * height) / (MIN_DISTANCE * MIN_DISTANCE * 2)),
      25 // Max 25 combinations available
    );
    const numCircles = Math.min(randomNumber(10, 15), maxCirclesForSpace, shuffledCombos.length);
    
    // Take the first N combinations for this round
    const selectedCombos = shuffledCombos.slice(0, numCircles);
    
    // Create circles with non-overlapping positions
    const newCircles: Circle[] = [];
    
    selectedCombos.forEach((combo, index) => {
      const { x, y } = generateValidPosition(newCircles, width, height);
      newCircles.push({
        id: index,
        color: combo.color,
        letter: combo.letter,
        x,
        y,
      });
    });
    
    setCircles(newCircles);
    
    // Set a random target from the available circles
    const targetIndex = Math.floor(Math.random() * newCircles.length);
    const targetCircle = newCircles[targetIndex];
    
    setTargetColor(targetCircle.color);
    setTargetLetter(targetCircle.letter);
  }, [width, height, gameActive]);

  // Initialize the game
  useEffect(() => {
    const updateDimensions = () => {
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        setWidth(gameContainer.offsetWidth);
        setHeight(gameContainer.offsetHeight);
      }
    };

    // Update dimensions and add event listener
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Start the game when dimensions are set
    if (width > 0 && height > 0) {
      generateNewRound();
    }

    // Timer for the game
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearInterval(timer);
    };
  }, [width, height, generateNewRound]);

  // Handle click on a circle
  const handleCircleClick = (circle: Circle) => {
    if (!gameActive) return;
    
    if (circle.color === targetColor && circle.letter === targetLetter) {
      // Correct choice
      setScore((prev) => prev + 1);
      generateNewRound();
    }
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

  // Handle skipping score submission
  const handleSkipSubmit = () => {
    router.push("/");
  };

  // Show the score submission form
  const handleShowSubmitForm = () => {
    setShowSubmitForm(true);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Game header */}
      <div className="bg-card shadow-md p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          {username && <div className="text-lg font-semibold">Player: {username}</div>}
          <div className="text-lg font-bold">Score: {score}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-lg font-semibold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : ""}`}>
            Time: {timeLeft}s
          </div>
          <Button 
            variant="outline" 
            className="text-sm" 
            onClick={() => {
              setGameActive(false);
            }}
          >
            End Game
          </Button>
        </div>
      </div>

      {/* Game instruction */}
      <div className="bg-muted p-4 text-center">
        <h2 className="text-xl font-bold">
          Select{" "}
          <span className={`font-bold px-2 py-1 rounded text-white ${COLOR_CLASSES[targetColor]}`}>
            {targetColor}
          </span>{" "}
          <span className="font-bold">{targetLetter}</span>
        </h2>
      </div>

      {/* Game area */}
      <div 
        id="game-container" 
        className="flex-1 relative bg-gradient-to-b from-background to-muted overflow-hidden"
      >
        {circles.map((circle) => (
          <button
            key={circle.id}
            className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white transition-transform duration-200 ${COLOR_CLASSES[circle.color]}`}
            style={{
              left: `${circle.x}px`,
              top: `${circle.y}px`,
              transform: `translate(-50%, -50%) scale(${1})`,
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: "2px", // Slight offset to account for visual centering
              transformOrigin: "center center",
              willChange: "transform",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
            }}
            onClick={() => handleCircleClick(circle)}
          >
            <span className="inline-flex items-center justify-center">{circle.letter}</span>
          </button>
        ))}

        {/* Game over overlay */}
        {!gameActive && !showSubmitForm && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Card className="w-80 p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-6">Your score: {score}</p>
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleShowSubmitForm}
                >
                  Submit Score
                </Button>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={handleSkipSubmit}
                >
                  Back to Menu
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Score submission form */}
        {!gameActive && showSubmitForm && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Card className="w-80 p-6">
              <h2 className="text-xl font-bold mb-4 text-center">Submit Your Score</h2>
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
                    <p className="text-center mb-3">Score: <span className="font-bold">{score}</span></p>
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
    </div>
  );
} 
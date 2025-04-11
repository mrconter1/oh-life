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
};

// Size of each circle (diameter in pixels)
const CIRCLE_SIZE = 48;
// Minimum distance between circle centers to prevent overlap
const MIN_DISTANCE = CIRCLE_SIZE + 8; // Add a small buffer
// Number of circles to display per round
const CIRCLES_PER_ROUND = 15;

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
  // Padding from edges as percentage of dimensions
  const horizontalPadding = Math.max(CIRCLE_SIZE / 2 + 10, maxWidth * 0.05);
  const verticalPadding = Math.max(CIRCLE_SIZE / 2 + 10, maxHeight * 0.05);
  
  // Available area for circles
  const minX = horizontalPadding;
  const maxX = maxWidth - horizontalPadding;
  const minY = 120 + verticalPadding; // Add 120px for header
  const maxY = maxHeight - verticalPadding;
  
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

  // Generate new circles and set a new target
  const generateNewRound = useCallback(() => {
    if (!gameActive) return;
    
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

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [width, height, generateNewRound]);

  // Handle click on a circle
  const handleCircleClick = (circle: Circle) => {
    if (!gameActive) return;
    
    if (circle.letter === targetLetter) {
      // Correct choice
      setScore((prev) => prev + 1);
      generateNewRound();
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

  return (
    <div className="flex flex-col h-screen">
      {/* Game header */}
      <div className="bg-card shadow-md py-4 px-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-6">
          {username && <div className="text-lg font-semibold">Player: {username}</div>}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Score</div>
          </div>
          <Button 
            variant="default" 
            className="px-5" 
            onClick={handleShowSubmitForm}
          >
            Submit Score
          </Button>
        </div>
      </div>

      {/* Game instruction */}
      <div className="bg-muted p-4 text-center">
        <h2 className="text-xl font-bold">
          Find the letter{" "}
          <span className="font-bold text-3xl">{targetLetter}</span>
        </h2>
      </div>

      {/* Game area */}
      <div 
        id="game-container" 
        className="flex-1 relative bg-gradient-to-b from-background to-muted overflow-hidden p-[5%]"
      >
        {circles.map((circle) => (
          <button
            key={circle.id}
            className="absolute w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white transition-transform duration-200 bg-black hover:bg-gray-800"
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

        {/* Score submission form */}
        {!gameActive && showSubmitForm && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
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
    </div>
  );
} 
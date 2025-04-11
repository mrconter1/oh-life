"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock data for the scoreboard
const MOCK_SCORES = [
  { id: 1, name: "Alice", score: 950 },
  { id: 2, name: "Bob", score: 820 },
  { id: 3, name: "Charlie", score: 780 },
  { id: 4, name: "Dave", score: 650 },
  { id: 5, name: "Eve", score: 520 },
  { id: 6, name: "Frank", score: 490 },
  { id: 7, name: "Grace", score: 450 },
  { id: 8, name: "Hannah", score: 410 },
  { id: 9, name: "Ian", score: 380 },
  { id: 10, name: "Julia", score: 350 },
];

export function MainMenu() {
  const [scores] = useState(MOCK_SCORES);

  return (
    <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gradient-to-b from-background to-background/90">
      <div className="w-full max-w-5xl px-4 py-4">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-1 text-foreground">Oh Life!</h1>
          <p className="text-muted-foreground text-sm">The game of choices and consequences</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Card */}
          <Card className="bg-card shadow-md rounded-xl border border-border/50">
            <CardHeader className="text-center py-3 pb-1">
              <CardTitle className="text-xl font-semibold">Start your journey</CardTitle>
              <CardDescription className="text-sm">Begin a new game and see where life takes you</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-3">
              <Link href="/game" className="w-full max-w-xs">
                <Button 
                  className="w-full py-5 text-lg font-medium cursor-pointer hover:cursor-pointer"
                >
                  Play Now
                </Button>
              </Link>
            </CardContent>
            <CardFooter className="flex justify-center pt-0 pb-3 text-xs text-muted-foreground italic">
              Your choices will shape your destiny
            </CardFooter>
          </Card>

          {/* Right Card */}
          <Card className="bg-card shadow-md rounded-xl border border-border/50">
            <CardHeader className="pb-1 pt-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Leaderboard</CardTitle>
                <CardDescription className="text-sm">The best players ranked by score</CardDescription>
              </div>
              <div className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
                Top 10
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="w-10 py-1.5 text-left text-muted-foreground font-medium text-xs">#</th>
                      <th className="py-1.5 text-left text-muted-foreground font-medium text-xs">Name</th>
                      <th className="py-1.5 text-right text-muted-foreground font-medium text-xs">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.slice(0, 7).map((score, index) => (
                      <tr 
                        key={score.id} 
                        className="border-b border-border/10 last:border-0"
                      >
                        <td className="py-1.5">
                          {index < 3 ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
                              index === 0 ? 'bg-amber-100 text-amber-600' : 
                              index === 1 ? 'bg-slate-100 text-slate-500' : 
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {index + 1}
                            </span>
                          ) : (
                            <span className="pl-2 text-muted-foreground">{index + 1}</span>
                          )}
                        </td>
                        <td className="py-1.5 font-medium">{score.name}</td>
                        <td className="py-1.5 text-right font-mono font-medium">{score.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
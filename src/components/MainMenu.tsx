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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for the scoreboard
const MOCK_SCORES = [
  { id: 1, name: "Alice", score: 950 },
  { id: 2, name: "Bob", score: 820 },
  { id: 3, name: "Charlie", score: 780 },
  { id: 4, name: "Dave", score: 650 },
  { id: 5, name: "Eve", score: 520 },
];

export function MainMenu() {
  const [scores] = useState(MOCK_SCORES);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-4xl space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-primary">Oh Life!</h1>
          <p className="text-xl text-muted-foreground">The game of choices and consequences</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Start your journey</CardTitle>
              <CardDescription>Begin a new game and see where life takes you</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Link href="/game" className="w-full md:w-2/3">
                <Button 
                  size="lg" 
                  className="w-full h-16 text-lg font-semibold"
                >
                  Play Now
                </Button>
              </Link>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              Your choices will shape your destiny
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Leaderboard</CardTitle>
              <CardDescription>Top scorers in Oh Life!</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>The top 5 players by score</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score, index) => (
                    <TableRow key={score.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{score.name}</TableCell>
                      <TableCell className="text-right">{score.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
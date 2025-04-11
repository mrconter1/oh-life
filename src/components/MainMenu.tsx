"use client";

import { useState, useEffect } from "react";
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
import { getTopScores, type Score } from "@/lib/supabase";

export function MainMenu() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScores() {
      setLoading(true);
      try {
        const { scores: fetchedScores, error } = await getTopScores(25);
        if (error) {
          setError(error);
        } else {
          setScores(fetchedScores);
        }
      } catch (err) {
        setError('Failed to load scores');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchScores();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gradient-to-b from-background to-background/90">
      <div className="w-full max-w-5xl px-4 py-4">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-2 text-foreground">Oh Life!</h1>
          <p className="text-muted-foreground text-sm">Let's have fun</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Card */}
          <Card className="bg-card shadow-md rounded-xl border border-border/50 overflow-hidden flex flex-col">
            <div className="border-b border-border/20">
              <CardHeader className="text-center py-4">
                <CardTitle className="text-2xl font-bold">Listen & Click</CardTitle>
                <CardDescription className="text-sm mt-1">Hear the letter, find it fast, top the leaderboard</CardDescription>
              </CardHeader>
            </div>
            <CardContent className="flex flex-col justify-center py-4 px-5 space-y-5 flex-grow">
              <div className="bg-muted/40 rounded-lg text-sm">
                <div className="border-b border-border/10 py-2 px-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    How to Play
                  </h3>
                </div>
                <ul className="p-3 space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">1</span>
                    </div>
                    <span className="pt-0.5">Listen for the spoken letter and find it among the circles</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">2</span>
                    </div>
                    <span className="pt-0.5">Click the correct circle to earn a point</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">3</span>
                    </div>
                    <span className="pt-0.5">If you click the wrong letter, a new board appears but your score remains</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">4</span>
                    </div>
                    <span className="pt-0.5">Submit your score when ready to appear on the leaderboard</span>
                  </li>
                </ul>
              </div>
              <Link href="/game" className="w-full self-center mt-auto">
                <Button 
                  className="w-full py-6 text-base font-medium shadow-sm transition-all hover:shadow-md cursor-pointer"
                >
                  Play Now
                </Button>
              </Link>
            </CardContent>
            <CardFooter className="py-3 text-center border-t border-border/20 bg-muted/20">
              <span className="text-xs text-muted-foreground text-center w-full">Your progress is lost if you exit – submit your score when you're done</span>
            </CardFooter>
          </Card>

          {/* Right Card */}
          <Card className="bg-card shadow-md rounded-xl border border-border/50 overflow-hidden flex flex-col">
            <div className="border-b border-border/20">
              <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
                  <CardDescription className="text-sm mt-1">The best players ranked by score</CardDescription>
                </div>
                <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-medium">
                  Top 25
                </div>
              </CardHeader>
            </div>
            <CardContent className="pt-0 pb-0 flex-grow">
              <div className="relative h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-[270px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[270px] text-sm text-muted-foreground">
                    Failed to load scores. Please try again later.
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[270px] scrollbar-hide">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="w-10 py-2.5 text-center text-muted-foreground font-medium text-xs sticky top-0 bg-card">#</th>
                          <th className="py-2.5 text-left text-muted-foreground font-medium text-xs sticky top-0 bg-card">Name</th>
                          <th className="py-2.5 text-right text-muted-foreground font-medium text-xs sticky top-0 bg-card">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.length > 0 ? (
                          scores.map((score, index) => (
                            <tr 
                              key={score.id} 
                              className="border-b border-border/10 last:border-0"
                            >
                              <td className="py-2 text-center">
                                {index < 3 ? (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
                                    index === 0 ? 'bg-amber-100 text-amber-600' : 
                                    index === 1 ? 'bg-slate-100 text-slate-500' : 
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {index + 1}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs font-medium">{index + 1}</span>
                                )}
                              </td>
                              <td className="py-2 font-medium">{score.name}</td>
                              <td className="py-2 text-right font-mono font-medium">{score.score}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                              No scores yet. Be the first to play!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
              </div>
            </CardContent>
            <CardFooter className="py-3 text-center border-t border-border/20 bg-muted/20">
              <span className="text-xs text-muted-foreground text-center w-full">Play now to get your name on the board!</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 
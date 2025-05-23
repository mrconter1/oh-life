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
    <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-background to-background/90 px-4 py-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-5">
          <div className="inline-block bg-black px-6 py-3 rounded-lg shadow-md mb-2 transform hover:scale-105 transition-transform duration-200">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">Oh Life!</h1>
          </div>
          <p className="text-muted-foreground text-sm">A game of focus and attention</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Card */}
          <Card className="bg-card shadow-md rounded-xl border border-border/50 overflow-hidden flex flex-col">
            <div className="border-b border-border/20">
              <CardHeader className="text-center py-3">
                <CardTitle className="text-xl sm:text-2xl font-bold">Listen & Click</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">An exercise in auditory focus</CardDescription>
              </CardHeader>
            </div>
            <CardContent className="flex flex-col justify-center py-3 px-4 space-y-4 flex-grow">
              <div className="bg-muted/40 rounded-lg text-sm">
                <div className="border-b border-border/10 py-2 px-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    How to Play
                  </h3>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-medium">1</span>
                      </div>
                      <span className="pt-0.5">Listen for the letter spoken at low volume</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-medium">2</span>
                      </div>
                      <span className="pt-0.5">Click on the correct letter to earn a point</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link href="/game" className="w-full self-center mt-auto">
                <Button 
                  className="w-full py-4 sm:py-6 text-sm sm:text-base font-medium shadow-sm transition-all hover:shadow-md cursor-pointer"
                >
                  Play Now
                </Button>
              </Link>
            </CardContent>
            <CardFooter className="py-2 text-center border-t border-border/20 bg-muted/20">
              <span className="text-xs text-muted-foreground text-center w-full">Submit your score when you decide you&apos;ve played enough</span>
            </CardFooter>
          </Card>

          {/* Right Card */}
          <Card className="bg-card shadow-md rounded-xl border border-border/50 overflow-hidden flex flex-col">
            <div className="border-b border-border/20">
              <CardHeader className="pb-3 pt-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold">Leaderboard</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Players ranked by endurance</CardDescription>
                </div>
                <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-medium">
                  Top 25
                </div>
              </CardHeader>
            </div>
            <CardContent className="pt-0 pb-0 flex-grow">
              <div className="relative h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-[230px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[230px] text-sm text-muted-foreground">
                    Failed to load scores. Please try again later.
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[230px] scrollbar-hide">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="w-10 py-2 text-center text-muted-foreground font-medium text-xs sticky top-0 bg-card">#</th>
                          <th className="py-2 text-left text-muted-foreground font-medium text-xs sticky top-0 bg-card">Name</th>
                          <th className="py-2 text-right text-muted-foreground font-medium text-xs sticky top-0 bg-card">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.length > 0 ? (
                          scores.map((score, index) => (
                            <tr 
                              key={score.id} 
                              className="border-b border-border/10 last:border-0"
                            >
                              <td className="py-1.5 text-center">
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
                              <td className="py-1.5 font-medium text-sm">{score.name}</td>
                              <td className="py-1.5 text-right font-mono font-medium text-sm">{score.score}</td>
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
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
              </div>
            </CardContent>
            <CardFooter className="py-2 text-center border-t border-border/20 bg-muted/20">
              <span className="text-xs text-muted-foreground text-center w-full">How long can you maintain focus?</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 
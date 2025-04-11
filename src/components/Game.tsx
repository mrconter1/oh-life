"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Game() {
  const [username, setUsername] = useState("");
  const [inputError, setInputError] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setInputError(true);
      return;
    }
    
    // Here you would normally store the username or start the game
    console.log(`Starting game for: ${username}`);
    setInputError(false);
    
    // In a real implementation, you might redirect or change state
    // router.push(`/game/play?username=${encodeURIComponent(username)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background/95 to-muted p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05),transparent_40%)] z-0"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 backdrop-blur-sm bg-card/95 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.05)_40%,rgba(var(--primary-rgb),0.02))] pointer-events-none"></div>
        
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl"></div>
        
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Welcome to Oh Life!</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Before we begin your journey, tell us what we should call you
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6">
            <div className="grid w-full items-center gap-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-base font-medium pl-1">Gaming Tag</Label>
                <Input
                  id="username"
                  placeholder="Enter your gaming tag..."
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setUsername(e.target.value);
                    if (inputError) setInputError(false);
                  }}
                  className={`h-12 px-4 bg-background/50 backdrop-blur-sm border-2 ring-offset-background focus-visible:ring-primary/20 ${inputError ? "border-destructive" : "border-input/50 focus:border-primary/50"}`}
                  autoFocus
                />
                {inputError && (
                  <p className="text-sm text-destructive font-medium ml-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    Please enter a gaming tag to continue
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2 pt-2 pb-6">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base font-semibold transition-all duration-300 bg-primary hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
            >
              Start Your Journey
            </Button>
            <p className="text-sm text-muted-foreground mt-2 text-center">Your choices will shape your destiny</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 
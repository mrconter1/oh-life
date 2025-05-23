import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Score {
  id?: number;
  name: string;
  score: number;
  created_at?: string;
}

/**
 * Submit a new score to the database
 */
export async function submitScore(name: string, score: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('scores')
      .insert([{ name, score }]);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit score';
    console.error('Error submitting score:', errorMessage);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Get the top 25 scores from the database
 */
export async function getTopScores(limit = 25): Promise<{ scores: Score[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { scores: data || [] };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch scores';
    console.error('Error fetching scores:', errorMessage);
    return { 
      scores: [], 
      error: errorMessage 
    };
  }
} 
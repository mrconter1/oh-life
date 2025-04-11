# Oh Life!

Oh Life! is a game where you listen to a spoken letter, find and click the correct letter among multiple options on the screen to score points and compete on a global leaderboard.

## Overview

"Oh Life!" is a simple but engaging game where players:
1. Listen to a spoken letter
2. Find and click on the correct letter among multiple options
3. Score points for correct selections
4. Compete on a global leaderboard

## Features

- **Listen & Click Gameplay**: Hear a letter being spoken and find it among multiple options
- **Real-time Feedback**: Visual feedback for correct and incorrect selections
- **Global Leaderboard**: Top 25 players displayed with their scores
- **Responsive Design**: Optimized for both desktop and mobile play
- **Text-to-Speech**: Clear audio pronunciation of letters

## Tech Stack

- **Frontend**: Next.js 15.3.0 with React 19
- **UI Framework**: TailwindCSS 4
- **Database**: Supabase for leaderboard functionality
- **Speech Synthesis**: Web Speech API for letter pronunciation

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Then, create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start playing.

## Database Setup

The game requires a Supabase database with a `scores` table with the following fields:
- `id`: Auto-incrementing primary key
- `name`: Text field for player name
- `score`: Integer field for player score
- `created_at`: Timestamp with default value of `now()`

## Deployment

Deploy the application using Vercel for the best experience:

```bash
npm run build
```

## License

This project is open source.

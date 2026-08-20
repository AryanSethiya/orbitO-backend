Orbito

Find the word at the center.

1. Product Summary

Orbito is a single-player daily semantic word game.

Every day, all players receive the same hidden word. Players independently submit guesses and receive a semantic rank showing how close each guess is to the target.

The player has three optional hints. Using a hint reduces the final score.

Players can create or join private environments such as friends, college groups, communities, or teams. Everyone plays independently, but their results are compared through leaderboards.

The game is designed to be extremely simple for the player while using a sophisticated semantic-ranking and AI system underneath.

2. Core Game Loop

Every day at 12:00 AM Asia/Kolkata:

A daily target word is selected.

Three hints are generated and validated.

The target is embedded.

The target is compared against the canonical vocabulary.

Every vocabulary word receives a deterministic rank.

The puzzle is published.

Player flow:

Open Orbito
    ↓
See today's puzzle
    ↓
Enter a word
    ↓
Receive semantic rank
    ↓
Explore semantic space
    ↓
Optionally use hints
    ↓
Reach Rank #1
    ↓
Receive final score
    ↓
See global/environment ranking
    ↓
See semantic journey + AI roast

Players do not need to be online at the same time.

3. Core Gameplay

Example target:

AIRPORT

Player guesses:

flight

Response:

Rank #84
🔥 Very Hot

Another guess:

terminal

Response:

Rank #18
🔥🔥 Burning

Correct answer:

airport

Response:

Rank #1
🎯 You found the center!

4. Semantic Ranking

4.1 Principle

The game must not convert similarity directly into a displayed rank.

Instead, every daily puzzle has a fixed canonical vocabulary.

Example:

Vocabulary = 50,000 words

For the daily target:

AIRPORT

calculate semantic similarity between the target and every vocabulary word.

Then sort the vocabulary by similarity:

Rank  Word       Similarity
1     airport    1.0000
2     terminal   0.9421
3     runway     0.9277
4     aviation   0.9162
5     flight     0.9048
...

The rank returned to every player is therefore deterministic and uniform.

If flight is Rank #5, every player who guesses flight receives Rank #5.

4.2 Similarity vs Rank

Internally store both:

semantic_score
rank

The player primarily sees the rank.

The raw similarity is used internally for analysis, debugging, and visualization.

4.3 Tie Breaking

Similarity is calculated with high precision.

If two words have exactly equal similarity, use a deterministic secondary ordering such as normalized lexical order.

Every eligible word must therefore have exactly one rank.

5. Canonical Vocabulary

The first version should use approximately 50,000 to 100,000 English words.

The vocabulary must be versioned.

Example:

vocabulary_version = v1

Exclude:

broken tokens

random abbreviations

obvious duplicates

extremely obscure words

unwanted/offensive words

problematic proper nouns

spelling artifacts

The same vocabulary version must remain available so historical puzzles remain reproducible.

6. Guess Handling

Every guess is normalized before lookup.

Examples:

Airport
AIRPORT
airport

should resolve consistently.

The system should also decide how to handle morphological variants such as:

run
runs
running

This behavior should be defined before launch and covered by tests.

Unknown words should receive a friendly response rather than breaking the game.

Example:

We don't know that word yet. Try another one.

7. Hints

Every daily puzzle has exactly three hints.

Hints are the same for every player.

Example:

Hint 1:
Strongly associated with travel.

Hint 2:
People often arrive here before a flight.

Hint 3:
Planes take off and land here.

Suggested costs

Hint 1 = -100 points
Hint 2 = -200 points
Hint 3 = -350 points

The costs should be configurable.

Hints cannot reduce the final score below zero.

Hint generation

The AI generates candidate hints, then a validation process checks:

relevance

correctness

semantic usefulness

increasing specificity

accidental answer leakage

Only validated hints are published.

Hints are generated once per puzzle, not separately for each user.

8. Scoring

Initial score:

1000 points

Suggested penalties:

Every guess = -5
Hint 1 = -100
Hint 2 = -200
Hint 3 = -350

These values are initial balancing values and should be adjusted after playtesting.

Discovery bonuses

Potential future bonus system:

First Rank <= 100 discovered in an environment: bonus
First Rank <= 50 discovered in an environment: bonus
First Rank <= 10 discovered in an environment: bonus

Do not implement discovery bonuses until the basic scoring system has been tested.

The primary MVP score should be deterministic and easy to understand.

9. Player Result

After solving, show:

🎯 SOLVED

Rank reached: #1
Guesses: 27
Hints used: 1
Time: 3m 42s
Final score: 742

Then compare:

Global rank: #182
Environment rank: #7

10. Semantic Journey

The player's guesses should be visualized as a journey toward the target.

Example:

travel       #842
   ↓
flight       #214
   ↓
airport      #84
   ↓
terminal     #18
   ↓
runway       #7
   ↓
AIRPORT      #1

The UI should make the progression visually satisfying.

Possible terminology:

Daily Puzzle

Orbit Map

Your Journey

Proximity

Center

Signal

Rank

The exact terminology can be refined during UI design.

11. Heatmap / Orbit Map

After the puzzle is solved, show the semantic exploration map.

Example:

                 travel
                    |
              transport
                    |
                 flight
                /      \
           airport    aircraft
               |
           terminal

Each node can show:

word

number of players who guessed it

best rank

average rank

During active gameplay, community information should be limited so players cannot simply copy another player's solution path.

The full environment heatmap can be revealed after the player completes the puzzle.

12. Environments

Players can create private environments.

Example:

Environment:
Bennett AI Club

Join Code:
A7K92X

Environment members can play independently.

Environment features:

daily leaderboard

weekly leaderboard

monthly leaderboard

member statistics

environment heatmap

AI roast

environment history

Possible future environments:

friends

college

gaming community

Discord community

company

family

13. Leaderboards

Global

Daily:

1. Player A     987
2. Player B     972
3. Player C     951

Weekly:

1. Player A     6,821
2. Player B     6,402
3. Player C     6,201

All-time:

1. Player A
2. Player B
3. Player C

Environment

Same structure, restricted to environment members.

Players do not need to play simultaneously.

14. AI Roast

After solving, Gemini generates a personalized reaction based on actual gameplay.

Inputs:

target word
guesses
rank progression
timestamps
hints used
final score
global rank
environment rank

Example:

You reached “flight” at #84, then spent 19 guesses wandering through hotel, luggage, and passport before finally finding airport. You were technically traveling in the right direction, just with no idea where you were going.

The roast must never alter the player's score or ranking.

It is purely post-game entertainment.

Possible roast styles:

Friendly

Savage

Hype

Professional

Default: Friendly/Savage balance.

15. AI Responsibilities

AI should be used where it adds value.

Google Gemini

Use Gemini for:

candidate puzzle generation

hint generation

hint validation

AI roast

puzzle difficulty analysis

Google Embedding Model

Use Google's current available embedding model for:

vocabulary embeddings

daily target embedding

semantic similarity

The exact model name should be configured rather than hard-coded because Google model availability and quotas can change.

Important

Do NOT call the LLM for every player guess.

Gameplay should be deterministic:

Guess
 ↓
normalize
 ↓
lookup precomputed rank
 ↓
return rank

This keeps the game fast and nearly free to operate.

16. Daily Puzzle Generation

A scheduled job runs every day at:

00:00 Asia/Kolkata

Pipeline:

Candidate generation
       ↓
Candidate filtering
       ↓
Semantic difficulty analysis
       ↓
Select target
       ↓
Generate 3 hints
       ↓
Validate hints
       ↓
Generate target embedding
       ↓
Compare against vocabulary
       ↓
Sort by similarity
       ↓
Assign Rank 1...N
       ↓
Persist puzzle
       ↓
Publish

The daily puzzle becomes immutable after publication.

17. Puzzle Quality

The target should not be selected randomly.

A good target should have:

multiple semantic neighbors

multiple plausible semantic paths

no obvious single synonym

reasonable word frequency

appropriate difficulty

useful semantic separation

Avoid targets that are trivially solved by:

word → exact synonym → answer

The puzzle selection system should score candidate words before publishing.

18. Data Model

Core tables:

users
daily_puzzles
vocabulary
puzzle_words
game_sessions
guesses
environments
environment_members
leaderboard_daily
ai_roasts
achievements
user_achievements

Important fields

daily_puzzles

id
date
target_word_id
vocabulary_version
hint_1
hint_2
hint_3
difficulty
status
created_at

vocabulary

id
word
normalized_word
embedding
vocabulary_version
is_active

puzzle_words

id
puzzle_id
word_id
semantic_score
rank

game_sessions

id
user_id
puzzle_id
started_at
completed_at
score
guesses_count
hints_used
solved

guesses

id
game_session_id
word_id
semantic_score
rank
created_at

19. Technology Stack

Frontend

React
TypeScript
Vite
Tailwind CSS
shadcn/ui
TanStack Query
Zod

Backend

Node.js
TypeScript
Fastify
Drizzle ORM

Database

PostgreSQL
pgvector

Cache

Redis
Upstash Redis

AI

Google Gemini
Google embedding model

ML / experimentation

Python
FastAPI
NumPy
Pandas
scikit-learn

Python should initially be used for experimentation/evaluation rather than as a mandatory production service.

Background jobs

BullMQ
Redis
GitHub Actions

Testing

Vitest
React Testing Library
Playwright

Deployment

Vercel
Free/low-cost backend platform
Supabase
Upstash

Monitoring

Sentry
OpenTelemetry later

20. Architecture

                         React + Vite
                              |
                              | REST
                              v
                       Node + Fastify
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
         PostgreSQL         Redis          Gemini
         + pgvector                         |
              |                       +-----+------+
              |                       |            |
              |                   LLM calls    Embeddings
              |
              v
       Precomputed Rankings
              |
              v
          Game Engine


GitHub Actions
      |
      v
Daily Trigger
      |
      v
BullMQ / Worker
      |
      +--> Puzzle Selection
      +--> Gemini Hints
      +--> Embedding
      +--> Ranking Generation
      +--> Puzzle Publication

21. Performance Strategy

The most important optimization is precomputation.

We should never calculate 50,000 semantic comparisons during a player's request.

Instead:

Daily puzzle created
        ↓
50,000 vocabulary comparisons
        ↓
50,000 ranks
        ↓
persist

Then:

Player guess
        ↓
indexed lookup
        ↓
rank

This makes a guess request extremely cheap and fast.

22. Redis Usage

Redis is not the source of truth.

PostgreSQL is the source of truth.

Redis is used for:

daily puzzle cache

leaderboard sorted sets

rate limiting

frequently accessed player statistics

temporary state

Example:

daily:2026-08-20
leaderboard:global:2026-08-20
leaderboard:environment:{id}:2026-08-20

23. Security

MVP security requirements:

secure authentication

password hashing through chosen auth provider

protected APIs

environment membership validation

rate limiting

input validation

server-side scoring

server-side hint deduction

server-side leaderboard updates

no client-controlled score

no client-controlled rank

A player must never be able to submit:

{
  "score": 999999
}

and influence their leaderboard score.

The server calculates everything.

24. Anti-Cheat

Initial anti-cheat:

rate limit guesses

server-side scoring

record timestamps

record hint usage

prevent duplicate scoring

detect suspicious solve patterns

Do not over-engineer anti-cheat in V1.

The leaderboard should be designed so cheating is inconvenient, but development should prioritize gameplay.

25. MVP

The first playable version should contain only:

Authentication

signup

login

profile

Game

today's word challenge

guess input

rank response

guess history

3 hints

scoring

solve screen

Competition

global daily leaderboard

personal history

AI

Gemini-generated hints

Gemini-generated post-game roast

Backend

daily puzzle generation

deterministic ranking

PostgreSQL

pgvector

Redis

No environments, heatmap, achievements, or advanced AI personalization are required for the first playable release.

26. V2

After the core game is fun:

environments

environment leaderboard

environment heatmap

weekly leaderboard

monthly leaderboard

streaks

achievements

personal statistics

semantic journey visualization

improved AI roast

27. V3

Only after V2 has real users:

personalized bonus puzzles

tournaments

friend leaderboard

public profiles

advanced player analytics

puzzle difficulty personalization

seasonal competitions

28. Product Principles

Principle 1: Simple gameplay

The user should only need to understand:

Guess a word and get closer to #1.

Principle 2: Deterministic competition

Every player gets:

the same target

the same vocabulary

the same hints

the same ranking system

Principle 3: AI should enhance, not control

AI creates:

puzzles

hints

personality

The core game engine controls:

similarity

rank

score

leaderboard

Principle 4: Single-player first

Players do not need to be online simultaneously.

Principle 5: Cheap by design

Normal guesses should not require LLM calls.

Principle 6: Build for fun first

If the basic daily game is not fun, additional AI features will not fix it.

29. Success Metrics

Initial metrics to track:

Daily Active Players
Daily Puzzle Completion Rate
Average Guesses
Average Hints Used
Average Score
Average Solve Time
Day-1 Retention
Day-7 Retention
Day-30 Retention
Daily Streak Length
Environment Creation Rate
Environment Join Rate
AI Roast Generation Rate

The most important early metric:

How many people come back tomorrow to play again?

30. First Development Milestone

The first milestone is intentionally tiny:

User logs in
      ↓
Today's puzzle loads
      ↓
User enters a word
      ↓
Backend finds its rank
      ↓
UI displays rank
      ↓
User keeps guessing
      ↓
User finds Rank #1
      ↓
Final score is calculated

Once this works reliably, we have the actual game.

Everything else is an enhancement around this loop.

31. Initial Brand

Orbito

Tagline:

Find the word at the center.

The visual identity should revolve around semantic space, proximity, and orbiting around the hidden target.

Possible product terminology:

Daily Puzzle     → Daily Orbit
Semantic Map     → Orbit Map
Similarity       → Proximity
Target           → Center
Hint             → Signal
Guess History    → Your Orbit

These terms are optional and should only be used if they improve clarity.

32. Final Product Definition

Orbito is a daily single-player semantic word game where every player explores the same semantic space to find a hidden word, competes asynchronously through leaderboards, uses limited hints strategically, and receives an AI-generated reaction to their solving style.

The player experience is:

Type a word. See how close you are. Explore. Think. Find the center.

The engineering experience is:

React + TypeScript + Node + Fastify + PostgreSQL + pgvector + Redis + BullMQ + Google Gemini + embeddings + CI/CD + testing + production deployment.
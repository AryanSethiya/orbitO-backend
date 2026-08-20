# 🗺️ Orbito Backend Engineering Roadmap

This document outlines the architectural milestones for the Orbito backend engine.

---

## 📍 Milestones Summary

### ✅ Milestone 1: Project Scaffolding & Clean Architecture Foundation
- Strict TypeScript (`NodeNext`), Fastify 5, Drizzle ORM, Vitest, Zod.
- Pure Domain Core: Scoring rules, Word normalizer, Proximity signal classifier, Domain error hierarchy.
- Relational & Vector Database Schemas (`users`, `vocabulary` with pgvector, `daily_puzzles`, `puzzle_words`, `game_sessions`, `guesses`, `environments`, `ai_roasts`).
- Fastify server with global error handling and `/api/v1/health`.

---

### ✅ Milestone 2: Canonical Vocabulary & Vector Embeddings Pipeline
- Pure Vector Math Utility (`dotProduct`, `vectorMagnitude`, `cosineSimilarity`, `normalizeVector`).
- Dual-mode Embedding Adapter: Google `text-embedding-004` (768d) + Deterministic Mock Generator for offline dev.
- Curated Starter Vocabulary dataset (190+ multi-domain words).
- `VocabularyRepository` and CLI Ingestion script (`src/scripts/seed-vocabulary.ts`).

---

### ✅ Milestone 3: Daily Puzzle Generator & Deterministic Ranking Engine
- Deterministic Ranking Service: Computes cosine similarity, sorts descending, and resolves ties using lexical secondary order (guaranteeing Rank #1 for target).
- Semantic Neighborhood & Difficulty Analyzer (`easy`, `medium`, `hard`).
- `PuzzleRepository` and `GenerateDailyPuzzleUseCase`.

---

### ✅ Milestone 4: Fastify Gameplay REST API & Session Engine
- `GameSessionRepository`: State machine, guess logging, and solve verification.
- `SubmitGuessUseCase`: Sub-millisecond rank lookup + proximity signal calculation + automatic score completion.
- `RequestHintUseCase`: Progressive disclosure with score penalties (-100, -200, -350).
- `GetSessionSummaryUseCase`: Complete orbit trajectory and score breakdown.
- Fastify routes:
  - `GET /api/v1/puzzles/today`
  - `POST /api/v1/sessions`
  - `POST /api/v1/sessions/:id/guess`
  - `POST /api/v1/sessions/:id/hints`
  - `GET /api/v1/sessions/:id`

---

### ✅ Milestone 5: Redis Leaderboards & Anti-Cheat Rate Limiting
- Redis Sorted Sets (`ZSET`): Sub-millisecond global & environment leaderboards (`ZADD`, `ZREVRANGE`, `ZRANK`).
- PostgreSQL $\leftrightarrow$ Redis sync & fallback.
- Leaderboard API endpoints (`/api/v1/leaderboards/daily`).
- Sliding-window rate limiter on guess submissions.

---

### ✅ Milestone 6: Google Gemini AI Integration & Automated Guardrails
- Lightweight Models: `gemini-2.0-flash` for generations and `text-embedding-004` for vectors.
- Automated Anti-Leakage & Difficulty Guardrail (`src/core/services/hint-validator.ts`): Guarantees zero target word stems and increasing specificity.
- Grounded Post-Game AI Roast Engine (`POST /api/v1/sessions/:id/roast`) with caching and multi-tone persona support (`friendly`, `savage`, `hype`, `balanced`).

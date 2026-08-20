CREATE TABLE "ai_roasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"roast_text" text NOT NULL,
	"roast_style" text DEFAULT 'balanced' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environment_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "environments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"score" integer DEFAULT 0 NOT NULL,
	"guesses_count" integer DEFAULT 0 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"solved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"semantic_score" double precision NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"normalized_word" text NOT NULL,
	"embedding" vector(768),
	"vocabulary_version" text DEFAULT 'v1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vocabulary_normalized_word_unique" UNIQUE("normalized_word")
);
--> statement-breakpoint
CREATE TABLE "daily_puzzles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"target_word_id" uuid NOT NULL,
	"vocabulary_version" text DEFAULT 'v1' NOT NULL,
	"hint_1" text NOT NULL,
	"hint_2" text NOT NULL,
	"hint_3" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_puzzles_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "puzzle_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"semantic_score" double precision NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_roasts" ADD CONSTRAINT "ai_roasts_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_members" ADD CONSTRAINT "environment_members_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_members" ADD CONSTRAINT "environment_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_puzzle_id_daily_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."daily_puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guesses" ADD CONSTRAINT "guesses_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guesses" ADD CONSTRAINT "guesses_word_id_vocabulary_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."vocabulary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_puzzles" ADD CONSTRAINT "daily_puzzles_target_word_id_vocabulary_id_fk" FOREIGN KEY ("target_word_id") REFERENCES "public"."vocabulary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_words" ADD CONSTRAINT "puzzle_words_puzzle_id_daily_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."daily_puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_words" ADD CONSTRAINT "puzzle_words_word_id_vocabulary_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."vocabulary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roast_session_idx" ON "ai_roasts" USING btree ("game_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "env_user_unique_idx" ON "environment_members" USING btree ("environment_id","user_id");--> statement-breakpoint
CREATE INDEX "env_code_idx" ON "environments" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "user_puzzle_session_idx" ON "game_sessions" USING btree ("user_id","puzzle_id");--> statement-breakpoint
CREATE INDEX "session_puzzle_idx" ON "game_sessions" USING btree ("puzzle_id");--> statement-breakpoint
CREATE INDEX "guess_session_idx" ON "guesses" USING btree ("game_session_id");--> statement-breakpoint
CREATE INDEX "guess_session_rank_idx" ON "guesses" USING btree ("game_session_id","rank");--> statement-breakpoint
CREATE INDEX "vocab_normalized_idx" ON "vocabulary" USING btree ("normalized_word");--> statement-breakpoint
CREATE INDEX "vocab_version_idx" ON "vocabulary" USING btree ("vocabulary_version");--> statement-breakpoint
CREATE INDEX "puzzles_date_idx" ON "daily_puzzles" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "puzzle_word_unique_idx" ON "puzzle_words" USING btree ("puzzle_id","word_id");--> statement-breakpoint
CREATE INDEX "puzzle_rank_idx" ON "puzzle_words" USING btree ("puzzle_id","rank");
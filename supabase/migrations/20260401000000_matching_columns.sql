/*
  # Matching System — Raw answers & missing columns

  Objectives:
  1. Tutor answers stored permanently in tutores.raw_answers
     (only overwritten on explicit profile update).
  2. Student's latest completed questionnaire overwrites previous answers
     (upsert by user_id), so marketplace order always reflects the most
     recent preferences.
  3. Both raw_answers columns are the single source of truth for all
     matching and marketplace ranking logic in BestFitTutors.ts.

  Changes:
  ─ temp_tutores : add raw_answers jsonb
  ─ tutores      : add raw_answers, rating, hourly_rate, experience,
                   education, location + UNIQUE(user_id)
  ─ students     : UNIQUE(user_id) so upsert replaces previous answers
*/

-- ── temp_tutores ──────────────────────────────────────────────────────────────
-- Stores partial answers during the tutor questionnaire session.
-- Deleted after successful registration.
ALTER TABLE temp_tutores
  ADD COLUMN IF NOT EXISTS raw_answers jsonb DEFAULT '{}';

-- ── tutores ───────────────────────────────────────────────────────────────────
-- raw_answers: all questionnaire keys (question_X_answer, _municipality, _parish …)
-- Never touched by the app after registration — only the tutor's explicit "edit profile"
-- flow should overwrite it.
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS raw_answers   jsonb    DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS rating        numeric  DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS hourly_rate   text     DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS experience    text     DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS education     text     DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS location      text     DEFAULT NULL;

-- One profile per tutor account.
-- Allows upsert { onConflict: 'user_id' } to update the profile on re-registration.
DO $$ BEGIN
  ALTER TABLE tutores ADD CONSTRAINT tutores_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── temp_tutores — DELETE policy (missing from migration 1) ──────────────────
-- Required: after tutor registration the session row is deleted from temp_tutores.
DO $$ BEGIN
  CREATE POLICY "Anyone can delete temp tutor data"
    ON temp_tutores FOR DELETE TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── students ──────────────────────────────────────────────────────────────────
-- UNIQUE(user_id) enables upsert: each new completed questionnaire replaces
-- the previous raw_answers so matching and marketplace order stay current.
DO $$ BEGIN
  ALTER TABLE students ADD CONSTRAINT students_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

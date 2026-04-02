/*
  # Semantic columns for tutores and students

  Replaces raw_answers key lookups with explicit, indexable columns so the
  marketplace can filter by any criterion with standard SQL.

  raw_answers is kept as-is (audit trail + priority-ranking data).

  ── tutores ──────────────────────────────────────────────────────────────────
  New columns (existing ones like subjects, hourly_rate, location, education,
  experience, rating are already present):

    class_type        text[]   — individual / grupo           (Q1)
    teaching_levels   text[]   — 1º Ciclo, Secundário …       (Q3 new / Q4 old)
    sessions_per_week text     — "1","2","3","4","5+"          (Q5 new / Q6 old)
    modalities        text[]   — presencial/online/centro …   (Q8 new / Q9 old)
    municipality      text     — concelho                     (Q9_mun new / Q11 old)
    parish            text     — freguesia                    (Q9_par new / Q12 old)
    study_center      text     — nome do centro de estudos    (Q10 new only)
    accepted_objectives text[] — tipos de aluno aceites       (Q11 new / Q17 old equiv)
    teaching_approach text[]   — metodologia de ensino        (Q13 new / Q15 old)
    hobbies           text[]   — interesses pessoais          (Q14 new / Q16 old)
    accepted_profiles text[]   — perfis de aluno aceites      (Q15 new / Q17 old)
    schedule          jsonb    — grelha de disponibilidade    (Q7 new / Q8 old)

  ── students ─────────────────────────────────────────────────────────────────
  New columns (subjects already exists):

    class_type        text     — individual / grupo           (Q1)
    level             text     — nível de ensino              (Q2)
    level_area        text     — área (Secundário/Superior)   (Q2_area)
    sessions_per_week text     — sessões/semana pretendidas   (Q4)
    budget            text     — orçamento/hora               (Q5)
    schedule          jsonb    — grelha de disponibilidade    (Q6)
    preferred_format  text     — presencial/online/…          (Q7)
    location          text     — distrito                     (Q8)
    municipality      text     — concelho                     (Q8_municipality)
    parish            text     — freguesia                    (Q8_parish)
    objective         text     — objetivo de aprendizagem     (Q9)
    preferred_approach text[]  — abordagem preferida          (Q10)
    hobbies           text[]   — interesses                   (Q11)
    profile           text     — perfil/necessidades          (Q12)
*/

-- ── Helpers ───────────────────────────────────────────────────────────────────

-- Safe jsonb → text[] (returns '{}' if null or not an array)
CREATE OR REPLACE FUNCTION jsonb_arr(j jsonb) RETURNS text[] AS $$
  SELECT CASE
    WHEN j IS NULL OR jsonb_typeof(j) <> 'array' THEN '{}'::text[]
    ELSE ARRAY(SELECT jsonb_array_elements_text(j))
  END
$$ LANGUAGE sql IMMUTABLE;

-- Wrap a nullable text in a 1-element array (used to normalise old string fields)
CREATE OR REPLACE FUNCTION text_to_arr(t text) RETURNS text[] AS $$
  SELECT CASE WHEN t IS NULL OR t = '' THEN '{}'::text[] ELSE ARRAY[t] END
$$ LANGUAGE sql IMMUTABLE;

-- ── tutores — add columns ─────────────────────────────────────────────────────

ALTER TABLE tutores ADD COLUMN IF NOT EXISTS class_type          text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS teaching_levels     text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS sessions_per_week   text    DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS modalities          text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS municipality        text    DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS parish              text    DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS study_center        text    DEFAULT NULL;
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS accepted_objectives text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS teaching_approach   text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS hobbies             text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS accepted_profiles   text[]  DEFAULT '{}';
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS schedule            jsonb   DEFAULT NULL;

-- ── tutores — backfill from raw_answers ───────────────────────────────────────
--
-- Heuristic to detect questionnaire version:
--   OLD questionnaire → raw_answers->>'question_3_answer' IN ('Sim','Não')
--   NEW questionnaire → question_3_answer is a JSON array (teaching levels)
--
-- This lets us apply the correct key mapping for each tutor.

UPDATE tutores SET

  class_type = CASE
    WHEN jsonb_typeof(raw_answers->'question_1_answer') = 'array'
      THEN jsonb_arr(raw_answers->'question_1_answer')
    ELSE text_to_arr(raw_answers->>'question_1_answer')
  END,

  teaching_levels = CASE
    -- OLD: levels at Q4
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN jsonb_arr(raw_answers->'question_4_answer')
    -- NEW: levels at Q3
    ELSE jsonb_arr(raw_answers->'question_3_answer')
  END,

  -- subjects already has its own column; only update if currently empty
  subjects = CASE
    WHEN subjects IS NOT NULL AND array_length(subjects, 1) > 0 THEN subjects
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN jsonb_arr(raw_answers->'question_5_answer')   -- OLD: subjects at Q5
    ELSE jsonb_arr(raw_answers->'question_4_answer')     -- NEW: subjects at Q4
  END,

  sessions_per_week = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN raw_answers->>'question_6_answer'             -- OLD: hours/week at Q6
    ELSE raw_answers->>'question_5_answer'               -- NEW: sessions at Q5
  END,

  hourly_rate = COALESCE(
    CASE WHEN hourly_rate IS NOT NULL AND hourly_rate <> '' THEN hourly_rate ELSE NULL END,
    CASE
      WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
        THEN raw_answers->>'question_7_answer'           -- OLD: rate at Q7
      ELSE raw_answers->>'question_6_answer'             -- NEW: rate at Q6
    END
  ),

  schedule = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN raw_answers->'question_8_answer'              -- OLD: grid at Q8
    ELSE raw_answers->'question_7_answer'                -- NEW: grid at Q7
  END,

  modalities = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      -- OLD: single string at Q9
      THEN text_to_arr(raw_answers->>'question_9_answer')
    ELSE
      -- NEW: array at Q8
      jsonb_arr(raw_answers->'question_8_answer')
  END,

  location = COALESCE(
    CASE WHEN location IS NOT NULL AND location <> '' THEN location ELSE NULL END,
    CASE
      WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
        THEN COALESCE(raw_answers->>'question_10_answer', raw_answers->>'question_11_answer')
      ELSE raw_answers->>'question_9_answer'
    END
  ),

  municipality = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN COALESCE(raw_answers->>'question_11_answer', raw_answers->>'question_12_answer')
    ELSE raw_answers->>'question_9_municipality'
  END,

  parish = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN COALESCE(raw_answers->>'question_12_answer', raw_answers->>'question_13_answer')
    ELSE raw_answers->>'question_9_parish'
  END,

  study_center = CASE
    WHEN raw_answers->>'question_3_answer' NOT IN ('Sim','Não')
      THEN raw_answers->>'question_10_answer'
    ELSE NULL
  END,

  accepted_objectives = CASE
    WHEN raw_answers->>'question_3_answer' NOT IN ('Sim','Não')
      THEN jsonb_arr(raw_answers->'question_11_answer')
    ELSE '{}'::text[]
  END,

  education = COALESCE(
    CASE WHEN education IS NOT NULL AND education <> '' THEN education ELSE NULL END,
    CASE
      WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
        THEN raw_answers->>'question_2_answer'           -- OLD: degree at Q2
      ELSE raw_answers->>'question_12_answer'            -- NEW: degree at Q12
    END
  ),

  teaching_approach = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN jsonb_arr(raw_answers->'question_15_answer')  -- OLD: methodology at Q15
    ELSE jsonb_arr(raw_answers->'question_13_answer')    -- NEW: approach at Q13
  END,

  hobbies = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN jsonb_arr(raw_answers->'question_16_answer')  -- OLD: hobbies at Q16
    ELSE jsonb_arr(raw_answers->'question_14_answer')    -- NEW: hobbies at Q14
  END,

  accepted_profiles = CASE
    WHEN raw_answers->>'question_3_answer' IN ('Sim','Não')
      THEN jsonb_arr(raw_answers->'question_17_answer')  -- OLD: profiles at Q17
    ELSE jsonb_arr(raw_answers->'question_15_answer')    -- NEW: profiles at Q15
  END

WHERE raw_answers IS NOT NULL AND raw_answers <> '{}'::jsonb;

-- ── students — add columns ────────────────────────────────────────────────────

ALTER TABLE students ADD COLUMN IF NOT EXISTS class_type         text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS level              text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS level_area         text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sessions_per_week  text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS budget             text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule           jsonb   DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_format   text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS location           text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS municipality       text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parish             text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS objective          text    DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_approach text[]  DEFAULT '{}';
ALTER TABLE students ADD COLUMN IF NOT EXISTS hobbies            text[]  DEFAULT '{}';
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile            text    DEFAULT NULL;

-- ── students — backfill from raw_answers ──────────────────────────────────────
-- Student questionnaire has not changed, so key mapping is straightforward.

UPDATE students SET
  class_type        = raw_answers->>'question_1_answer',
  level             = raw_answers->>'question_2_answer',
  level_area        = raw_answers->>'question_2_area',
  subjects          = CASE
                        WHEN subjects IS NOT NULL AND array_length(subjects, 1) > 0 THEN subjects
                        ELSE jsonb_arr(raw_answers->'question_3_answer')
                      END,
  sessions_per_week = raw_answers->>'question_4_answer',
  budget            = raw_answers->>'question_5_answer',
  schedule          = raw_answers->'question_6_answer',
  preferred_format  = raw_answers->>'question_7_answer',
  location          = raw_answers->>'question_8_answer',
  municipality      = raw_answers->>'question_8_municipality',
  parish            = raw_answers->>'question_8_parish',
  objective         = raw_answers->>'question_9_answer',
  preferred_approach = jsonb_arr(raw_answers->'question_10_answer'),
  hobbies           = jsonb_arr(raw_answers->'question_11_answer'),
  profile           = raw_answers->>'question_12_answer'
WHERE raw_answers IS NOT NULL AND raw_answers <> '{}'::jsonb;

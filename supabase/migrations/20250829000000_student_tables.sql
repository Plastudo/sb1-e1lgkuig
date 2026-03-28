/*
  # Create students and temp_students tables

  1. New Tables
    - `temp_students`
      - `id` (uuid, primary key)
      - `session_id` (text, unique)
      - `question_1_answer` (text) - first answer (format preference)
      - `raw_answers` (jsonb) - all questionnaire answers
      - `created_at` (timestamp)

    - `students`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `question_1_answer` (text)
      - `raw_answers` (jsonb) - all questionnaire answers
      - `subjects` (text[]) - extracted from raw_answers.question_5_answer
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - `temp_students`: Public read/write/update/delete (no auth required)
    - `students`: All can read, authenticated users can only insert/update their own records
*/

-- Create temp_students table
CREATE TABLE IF NOT EXISTS temp_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  question_1_answer text NOT NULL DEFAULT '',
  raw_answers jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add raw_answers column if missing (safe for existing tables)
DO $$ BEGIN
  ALTER TABLE temp_students ADD COLUMN raw_answers jsonb DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create students permanent table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  email text DEFAULT '',
  question_1_answer text DEFAULT '',
  raw_answers jsonb DEFAULT '{}',
  subjects text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to students if they exist without them
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN raw_answers jsonb DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE students ADD COLUMN subjects text[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE temp_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for temp_students (public access for questionnaire)
DO $$ BEGIN
  CREATE POLICY "Anyone can insert temp student data"
    ON temp_students FOR INSERT TO anon, authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can update temp student data"
    ON temp_students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read temp student data"
    ON temp_students FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can delete temp student data"
    ON temp_students FOR DELETE TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for students
DO $$ BEGIN
  CREATE POLICY "Anyone can read student profiles"
    ON students FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own student profile"
    ON students FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own student profile"
    ON students FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger for updated_at on students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at'
  ) THEN
    CREATE TRIGGER update_students_updated_at
      BEFORE UPDATE ON students
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

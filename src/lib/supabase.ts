import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos

export type TempTutorData = {
  id?: string;
  session_id: string;
  question_1_answer: string;
  raw_answers?: Record<string, any>;
  created_at?: string;
};

export type TutorData = {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  question_1_answer: string;
  raw_answers?: Record<string, any>;
  bio?: string;
  subjects?: string[];
  availability?: string[];
  rating?: number;
  location?: string;
  profile_picture?: string;
  hourly_rate?: string;
  experience?: string;
  education?: string;
  education_university?: string;
  education_course?: string;
  success_rate?: string;
  total_students?: number;
  availability_summary?: string;
  created_at?: string;
  updated_at?: string;
  // Semantic columns (added by migration 20260402000000_semantic_columns.sql)
  class_type?: string[];
  teaching_levels?: string[];
  sessions_per_week?: string;
  modalities?: string[];
  municipality?: string;
  parish?: string;
  study_center?: string;
  accepted_objectives?: string[];
  teaching_approach?: string[];
  hobbies?: string[];
  accepted_profiles?: string[];
  schedule?: Record<string, any>;
};

export type TempStudentData = {
  id?: string;
  session_id: string;
  question_1_answer: string;
  raw_answers?: Record<string, any>;
  created_at?: string;
};

export type StudentData = {
  id?: string;
  user_id: string;
  name?: string;
  email?: string;
  question_1_answer?: string;
  raw_answers?: Record<string, any>;
  subjects?: string[];
  created_at?: string;
  updated_at?: string;
  // Semantic columns (added by migration 20260402000000_semantic_columns.sql)
  class_type?: string;
  level?: string;
  level_area?: string;
  sessions_per_week?: string;
  budget?: string;
  schedule?: Record<string, any>;
  preferred_format?: string;
  location?: string;
  municipality?: string;
  parish?: string;
  objective?: string;
  preferred_approach?: string[];
  hobbies?: string[];
  profile?: string;
};

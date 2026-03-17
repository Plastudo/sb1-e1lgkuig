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
  success_rate?: string;
  total_students?: number;
  availability_summary?: string;
  created_at?: string;
  updated_at?: string;
};

export type TempStudentData = {
  id?: string;
  session_id: string;
  question_1_answer: string;
  question_2_answer: string;
  created_at?: string;
};

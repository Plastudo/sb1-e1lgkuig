import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://stckxrujvofhpofaksen.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y2t4cnVqdm9maHBvZmFrc2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTI2NzIsImV4cCI6MjA3Njg4ODY3Mn0.1fyDEMGhZSCkX0v61Ds-H3fZnID7QTygp77x5cibAQE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TempTutorData = {
  id?: string
  session_id: string
  question_1_answer: string
  created_at?: string
}

export type TutorData = {
  id?: string
  user_id: string
  name: string
  email: string
  question_1_answer: string
  bio?: string
  subjects?: string[]
  availability?: string[]
  rating?: number
  location?: string
  profile_picture?: string
  created_at?: string
  updated_at?: string
}

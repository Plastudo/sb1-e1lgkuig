import { createClient } from '@supabase/supabase-js'

const supabaseUrl =  import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey =  import.meta.env.VITE_SUPABASE_ANON_KEY

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

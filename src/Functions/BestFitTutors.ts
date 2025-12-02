import { supabase } from "../lib/supabase";

export interface TutorMatch {
  tutorId: string;
  compatibility: number;
  name?: string;
  profile_picture?: string | null;
  subjects?: string[] | null;
  rating?: number | null;
  bio?: string | null;
  email?: string | null;
}

export async function getBestTutorMatches(): Promise<TutorMatch[]> {
  // Busca todos os tutores
  const { data: tutors, error } = await supabase.from("tutores").select("*");

  if (error) {
    console.error("Erro ao buscar tutores:", error);
    throw new Error("Erro ao buscar tutores");
  }

  if (!tutors || tutors.length === 0) return [];

  // Embaralha array de tutores
  const shuffled = tutors.sort(() => Math.random() - 0.5);

  // Seleciona até 3 tutores aleatórios
  const selected = shuffled.slice(0, 3);

  // Retorna no formato TutorMatch
  return selected.map((t: any) => ({
    tutorId: String(t.id),
    compatibility: Math.floor(Math.random() * 101), // 0–100 aleatório (ou defina fixo, ex: 0)
    name: t.name,
    profile_picture: t.profile_picture || null,
    subjects: t.subjects || null,
    rating: t.rating !== undefined && t.rating !== null ? Number(t.rating) : null,
    bio: t.bio || null,
    email: t.email || null,
  }));
}

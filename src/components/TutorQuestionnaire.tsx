//-----------------RESUMO GERAL-----------------
// Versão refatorada do TutorQuestionnaire
// - Suporta QUALQUER número de perguntas sem alterar lógica
// - Guarda respostas dinamicamente no Supabase (temp e final)
// - Mantém UI, animações, progress bar e navegação


//-----------------IMPORTAÇÕES-----------------
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { AuthModal } from './AuthModal'


//-----------------PERGUNTAS DO QUESTIONÁRIO-----------------
// 👉 A ÚNICA ZONA onde precisas mexer para adicionar perguntas
const questions = [
{
id: 1,
title: 'Qual é a sua área principal de expertise?',
options: [
{ value: 'matematica', label: 'A) Matemática e Ciências Exatas' },
{ value: 'linguas', label: 'B) Línguas e Literatura' },
{ value: 'ciencias', label: 'C) Ciências Naturais e Biologia' },
{ value: 'humanas', label: 'D) Ciências Humanas e Sociais' }
]
},
{
id: 2,
title: 'Qual é o seu nível de experiência a ensinar?',
options: [
{ value: 'iniciante', label: 'A) Iniciante' },
{ value: 'intermedio', label: 'B) Intermédio' },
{ value: 'avancado', label: 'C) Avançado' }
]
}
]


//-----------------COMPONENTE PRINCIPAL-----------------
export const TutorQuestionnaire = () => {
const [currentQuestion, setCurrentQuestion] = useState(0)
const [answers, setAnswers] = useState<Record<string, string>>({})
const [sessionId] = useState(() => crypto.randomUUID())
const [showAuth, setShowAuth] = useState(false)
const navigate = useNavigate()


//-----------------RESPONDER PERGUNTA-----------------
const handleAnswer = async (questionId: number, answer: string) => {
const newAnswers = {
...answers,
[`question_${questionId}_answer`]: answer
}


setAnswers(newAnswers)


try {
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
if (!supabaseUrl || supabaseUrl.includes('placeholder')) return


// 🔥 Guarda TODAS as respostas dinamicamente
const tempData = {
session_id: sessionId,
...newAnswers
}


await supabase
.from('temp_tutores')
.upsert(tempData, { onConflict: 'session_id' })
} catch (error) {
console.warn('Erro ao guardar dados temporários:', error)
}


if (currentQuestion < questions.length - 1) {
setCurrentQuestion((prev) => prev + 1)
} else {
setShowAuth(true)
}
}


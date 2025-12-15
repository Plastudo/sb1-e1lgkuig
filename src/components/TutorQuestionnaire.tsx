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
</div>
<p className='text-sm text-gray-600 mt-2 text-center'>
Pergunta {currentQuestion + 1} de {questions.length}
</p>
</motion.div>


<AnimatePresence mode='wait'>
<motion.div
key={currentQuestion}
initial={{ opacity: 0, x: 50 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -50 }}
transition={{ duration: 0.3 }}
>
<Card className='p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm'>
<h2 className='text-2xl font-bold text-gray-900 mb-8 text-center'>
{question.title}
</h2>


<div className='space-y-4'>
{question.options.map((option, index) => (
<motion.button
key={option.value}
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.1 }}
onClick={() => handleAnswer(question.id, option.value)}
className='w-full p-4 text-left border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all'
>
<div className='flex items-center justify-between'>
<span className='text-lg text-gray-700'>{option.label}</span>
<ChevronRight className='h-5 w-5 text-gray-400' />
</div>
</motion.button>
))}
</div>


<div className='flex justify-between mt-8'>
<Button
variant='outline'
onClick={goBack}
disabled={currentQuestion === 0}
className='flex items-center space-x-2'
>
<ChevronLeft className='h-4 w-4' />
<span>Anterior</span>
</Button>


{answers[`question_${question.id}_answer`] && (
<div className='flex items-center space-x-2 text-green-600'>
<Check className='h-4 w-4' />
<span>Respondido</span>
</div>
)}
</div>
</Card>
</motion.div>
</AnimatePresence>
</div>
</div>
)
}

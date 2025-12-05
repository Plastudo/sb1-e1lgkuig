// StudentQuestionnaire.tsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ChevronRight, ChevronLeft, Check, Star, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { getBestTutorMatches, TutorMatch } from "../Functions/BestFitTutors";

interface QuestionOption {
  value: string;
  label: string;
}

interface Question {
  id: number;
  title: string;
  options: QuestionOption[];
  multiple?: boolean;
}

// ------------------------------
// PERGUNTAS DO QUESTIONÁRIO
// ------------------------------
const questions: Question[] = [
  {
    id: 1,
    title: "Em que área precisa de ajuda?",
    multiple: false,
    options: [
      { value: "matematica", label: "A) Matemática e Ciências Exatas" },
      { value: "linguas", label: "B) Línguas e Literatura" },
      { value: "ciencias", label: "C) Ciências Naturais e Biologia" },
      { value: "humanas", label: "D) Ciências Humanas e Sociais" },
    ],
  },
  {
    id: 2,
    title: "Qual a fase escolar?",
    multiple: false,
    options: [
      { value: "basico", label: "A) Ensino Básico" },
      { value: "secundario", label: "B) Ensino Secundário" },
      { value: "superior", label: "C) Ensino Superior" },
    ],
  },
  {
    id: 3,
    title: "Qual é o período que tem maior disponibilidade?",
    multiple: true,
    options: [
      { value: "manha", label: "A) Manhã" },
      { value: "tarde", label: "B) Tarde" },
      { value: "noite", label: "C) Noite" },
    ],
  },
];

// ------------------------------
// COMPONENTE MODULAR QuestionCard
// ------------------------------
interface QuestionCardProps {
  question: Question;
  answer: string | string[] | undefined;
  loading: boolean;
  onSelect: (value: string) => void;
  onContinue?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  loading,
  onSelect,
  onContinue,
}) => {
  const isMulti = question.multiple;

  const isSelected = (value: string) => {
    if (isMulti && Array.isArray(answer)) return answer.includes(value);
    return answer === value;
  };

  const disableContinue = isMulti && (!answer || (Array.isArray(answer) && answer.length === 0));

  return (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{question.title}</h2>
      <div className="space-y-4">
        {question.options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => onSelect(option.value)}
            disabled={loading}
            className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 group
              ${isSelected(option.value)
                ? "border-blue-500 bg-blue-100"
                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-lg ${isSelected(option.value) ? "text-blue-700" : "text-gray-700"}`}
              >
                {option.label}
              </span>
              {isSelected(option.value) ? (
                <Check className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Botão continuar exclusivo para MULTI */}
      {isMulti && (
        <div className="mt-8 text-center">
          <Button
            onClick={onContinue}
            disabled={disableContinue || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            Continuar
          </Button>
        </div>
      )}
    </Card>
  );
};

// ------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------
export const StudentQuestionnaire: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [matchedTutors, setMatchedTutors] = useState<TutorMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const sessionIdRef = useRef<string>(uuidv4());

  // --------------------------------
  // SALVAR RESPOSTAS NO SUPABASE
  // --------------------------------
  const saveAnswersToSupabase = async (answers: Record<string, string | string[]>) => {
    const payload = {
      session_id: sessionIdRef.current,
      question_1_answer: answers.question_1_answer || null,
      question_2_answer: answers.question_2_answer || null,
      question_3_answer: answers.question_3_answer || null,
    };

    const { data, error } = await supabase.from("temp_students").insert(payload).select("*").single();
    if (error) return null;
    return data;
  };

  // --------------------------------
  // HANDLER GENÉRICO ESCALÁVEL
  // --------------------------------
  const handleSelect = (questionId: number, value: string) => {
    const question = questions.find((q) => q.id === questionId);
    const key = `question_${questionId}_answer`;

    let updated = { ...answers };

    if (question?.multiple) {
      const current = Array.isArray(updated[key]) ? (updated[key] as string[]) : [];
      updated[key] = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
    } else {
      updated[key] = value;
      advanceIfSingle(questionId, updated);
    }

    setAnswers(updated);
  };

  // Avança automaticamente em perguntas single
  const advanceIfSingle = async (
    questionId: number,
    updatedAnswers: Record<string, string | string[]>
  ) => {
    const isLast = currentQuestion === questions.length - 1;

    if (!isLast) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    await finalize(updatedAnswers);
  };

  // Continuar manual para MULTI SELECT
  const continueMulti = async () => {
    const questionId = questions[currentQuestion].id;
    const isLast = currentQuestion === questions.length - 1;
    const updated = answers;

    if (!isLast) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    await finalize(updated);
  };

  // --------------------------------
  // PROCESSAMENTO FINAL
  // --------------------------------
  const finalize = async (updatedAnswers: Record<string, string | string[]>) => {
    setLoading(true);
    try {
      await saveAnswersToSupabase(updatedAnswers);
      const topMatches = await getBestTutorMatches(updatedAnswers);
      setMatchedTutors(topMatches);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
      setCurrentQuestion(questions.length - 1);
    } else if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  // ------------------------------
  // RESULTADOS
  // ------------------------------
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Os seus matches perfeitos!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Baseado nas suas respostas, encontrámos estes explicadores ideais para si.
            </p>
            <Button variant="outline" onClick={goBack} className="mb-4" disabled={loading}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Voltar ao questionário
            </Button>
          </motion.div>

          {matchedTutors.length === 0 ? (
            <Card className="p-6 bg-white/80">
              <p className="text-center text-gray-700">Nenhum tutor encontrado. Por favor tenta novamente mais tarde.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {matchedTutors.map((tutor, index) => (
                <motion.div
                  key={tutor.tutorId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
                    <div className="text-center mb-4">
                      <img
                        src={tutor.profile_picture || "/default-avatar.png"}
                        alt={tutor.name || "Tutor"}
                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      />
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{tutor.name || "—"}</h3>
                      <p className="text-green-600 font-medium mb-2">{tutor.subjects?.[0] || "—"}</p>
                      <div className="flex items-center justify-center space-x-1 mb-3">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">{tutor.rating ?? "—"}</span>
                      </div>
                      <p className="text-blue-600 font-semibold text-sm">Compatibilidade: {tutor.compatibility}%</p>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.bio}</p>
                    <div className="space-y-2">
                      <Button onClick={() => navigate(`/profile/${tutor.tutorId}`)} variant="outline" className="w-full">
                        Ver perfil completo
                      </Button>
                      <Button
                        onClick={() =>
                          window.location.href = `mailto:${tutor.email}?subject=Contacto&body=Olá ${tutor.name}`
                        }
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                      >
                        <Mail className="h-4 w-4 mr-2" /> Contactar
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------
  // QUESTIONÁRIO
  // ------------------------------
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answerKey = `question_${question.id}_answer`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Pergunta {currentQuestion + 1} de {questions.length}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <QuestionCard
              question={question}
              answer={answers[answerKey]}
              loading={loading}
              onSelect={(value) => handleSelect(question.id, value)}
              onContinue={continueMulti}
            />

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentQuestion === 0 || loading}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>

              <div className="text-sm text-gray-500">
                {answers[answerKey] && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Check className="h-4 w-4" />
                    <span>Respondido</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

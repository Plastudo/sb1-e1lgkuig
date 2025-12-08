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

// DnD Kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// -------------------------------------
// QUESTION MODEL
// -------------------------------------
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

// -------------------------------------
// COMPONENT: Progress Bar
// -------------------------------------
const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const pct = (value / max) * 100;

  return (
    <div className="mb-8">
      <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-green-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-center text-gray-600 mt-2 text-sm">
        Pergunta {value} de {max}
      </p>
    </div>
  );
};

// -------------------------------------
// COMPONENT: QuestionCard
// -------------------------------------
const QuestionCard = ({
  question,
  answer,
  loading,
  onSelect,
  onContinue,
}: {
  question: Question;
  answer: string | string[] | undefined;
  loading: boolean;
  onSelect: (value: string) => void;
  onContinue?: () => void;
}) => {
  const isMulti = question.multiple;

  const isSelected = (val: string) =>
    isMulti && Array.isArray(answer) ? answer.includes(val) : answer === val;

  const disable =
    isMulti &&
    (!answer || (Array.isArray(answer) && answer.length === 0));

  return (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        {question.title}
      </h2>

      <div className="space-y-4">
        {question.options.map((option, i) => (
          <motion.button
            key={option.value}
            onClick={() => onSelect(option.value)}
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200
              ${
                isSelected(option.value)
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
              }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-lg ${
                  isSelected(option.value)
                    ? "text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </span>
              {isSelected(option.value) ? (
                <Check className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {isMulti && (
        <div className="mt-8 text-center">
          <Button
            disabled={disable}
            onClick={onContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-full"
          >
            Continuar
          </Button>
        </div>
      )}
    </Card>
  );
};

// -------------------------------------
// COMPONENT: SortableRankingItem (CORRIGIDO)
// -------------------------------------
const SortableRankingItem = ({ item }: { item: any }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <Card
        className={`w-full p-4 rounded-2xl border-2 mb-3 transition-all duration-200
        ${
          isDragging
            ? "border-blue-500 bg-blue-100 shadow-xl scale-[1.02]"
            : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg text-gray-800 font-medium">{item.title}</p>
            {item.answer && (
              <p className="text-sm text-gray-500 mt-1">
                {Array.isArray(item.answer)
                  ? item.answer.join(", ")
                  : item.answer}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </Card>
    </div>
  );
};

// -------------------------------------
// COMPONENT: RankingQuestion (CORRIGIDO)
// -------------------------------------
const RankingQuestion = ({
  questions,
  answers,
  onComplete,
}: {
  questions: Question[];
  answers: Record<string, any>;
  onComplete: (ranking: any[]) => void;
}) => {
  const initialItems = questions.map((q) => ({
    id: q.id.toString(),
    title: q.title,
    answer: answers[`question_${q.id}_answer`],
  }));

  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const activeItem = activeId
    ? items.find((i) => i.id === activeId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Ordene as perguntas anteriores por importância
          </h2>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {items.map((item) => (
                  <SortableRankingItem key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeItem && (
                <Card className="w-full p-4 rounded-2xl border-2 border-blue-500 bg-blue-100 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg text-gray-800 font-medium">
                        {activeItem.title}
                      </p>
                      {activeItem.answer && (
                        <p className="text-sm text-gray-600 mt-1">
                          {Array.isArray(activeItem.answer)
                            ? activeItem.answer.join(", ")
                            : activeItem.answer}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                  </div>
                </Card>
              )}
            </DragOverlay>
          </DndContext>

          <div className="text-center mt-8">
            <Button
              onClick={() =>
                onComplete(
                  items.map((i, idx) => ({
                    questionId: i.id,
                    rank: idx + 1,
                  }))
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
            >
              Finalizar Questionário
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// -------------------------------------
// COMPONENT: TutorResults
// -------------------------------------
const TutorResults = ({
  tutors,
  goBack,
  loading,
}: {
  tutors: TutorMatch[];
  goBack: () => void;
  loading: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Os seus matches perfeitos!
          </h2>
          <p className="text-gray-600 mb-4">
            Baseado nas suas respostas, encontrámos estes explicadores ideais
            para si.
          </p>

          <Button variant="outline" onClick={goBack} disabled={loading}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar ao questionário
          </Button>
        </motion.div>

        {tutors.length === 0 ? (
          <Card className="p-6 bg-white/80">
            <p className="text-center text-gray-700">
              Nenhum tutor encontrado. Por favor tenta novamente mais tarde.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((t) => (
              <Card
                key={t.tutorId}
                className="p-6 bg-white/80 shadow hover:shadow-lg transition rounded-2xl"
              >
                <div className="text-center">
                  <img
                    src={t.profile_picture || "/default-avatar.png"}
                    className="w-20 h-20 rounded-full mx-auto object-cover mb-3"
                  />

                  <h3 className="text-xl font-semibold">
                    {t.name || "—"}
                  </h3>
                  <p className="text-green-600 font-medium">
                    {t.subjects?.[0] || "—"}
                  </p>

                  <div className="flex justify-center items-center space-x-1 mt-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm">{t.rating ?? "—"}</span>
                  </div>

                  <div className="mt-2">
                    <p className="text-blue-600 font-semibold text-sm mb-1">
                      Compatibilidade: {t.compatibility}%
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${t.compatibility}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mt-3 line-clamp-3">{t.bio}</p>

                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/profile/${t.tutorId}`)
                    }
                    className="w-full"
                  >
                    Ver perfil completo
                  </Button>

                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500"
                    onClick={() =>
                      (window.location.href = `mailto:${t.email}?subject=Contacto&body=Olá ${t.name}`)
                    }
                  >
                    <Mail className="w-4 h-4 mr-2" /> Contactar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------
// MAIN COMPONENT
// -------------------------------------
export const StudentQuestionnaire = () => {
  const navigate = useNavigate();
  const sessionIdRef = useRef(uuidv4());

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [rankingMode, setRankingMode] = useState(false);
  const [resultsMode, setResultsMode] = useState(false);
  const [matched, setMatched] = useState<TutorMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const saveToSupabase = async (data: any) => {
    await supabase.from("temp_students").insert({
      session_id: sessionIdRef.current,
      ...data,
    });
  };

  const handleSelect = (qId: number, value: string) => {
    const key = `question_${qId}_answer`;
    const question = questions.find((q) => q.id === qId);

    const updated = { ...answers };

    if (question?.multiple) {
      const prev = Array.isArray(updated[key]) ? updated[key] : [];
      updated[key] = prev.includes(value)
        ? prev.filter((v: string) => v !== value)
        : [...prev, value];
    } else {
      updated[key] = value;

      if (current < questions.length - 1) {
        setCurrent((v) => v + 1);
      } else {
        setRankingMode(true);
      }
    }

    setAnswers(updated);
  };

  const continueMulti = () => {
    if (current < questions.length - 1) setCurrent((v) => v + 1);
    else setRankingMode(true);
  };

  const finalize = async (finalAnswers: any) => {
    setLoading(true);
    await saveToSupabase(finalAnswers);
    const matches = await getBestTutorMatches(finalAnswers);

    setMatched(matches);
    setResultsMode(true);
    setLoading(false);
  };

  const goBack = () => {
    if (resultsMode) setResultsMode(false);
    else if (rankingMode) setRankingMode(false);
    else if (current > 0) setCurrent((v) => v - 1);
  };

  if (resultsMode)
    return (
      <TutorResults tutors={matched} goBack={goBack} loading={loading} />
    );

  if (rankingMode)
    return (
      <RankingQuestion
        questions={questions}
        answers={answers}
        onComplete={(ranking) => {
          const merged = { ...answers };
          ranking.forEach((r) => {
            merged[`question_${r.questionId}_rank`] = r.rank;
          });
          finalize(merged);
        }}
      />
    );

  const question = questions[current];
  const answerKey = `question_${question.id}_answer`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <ProgressBar value={current + 1} max={questions.length} />

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
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
                disabled={current === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>

              {answers[answerKey] && (
                <div className="flex items-center text-blue-600 text-sm">
                  <Check className="w-4 h-4 mr-1" /> Respondido
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

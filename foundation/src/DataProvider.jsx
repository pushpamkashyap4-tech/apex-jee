import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

/**
 * @typedef {{ front: string, back: string }} Flashcard
 * @typedef {{ question: string, options: [string, string, string, string], correctAnswer: number, optionExplanations: [string, string, string, string], fullExplanation: string }} Quiz
 * @typedef {{ id: string, subject: string, unit: string, name: string, classLevel: string, cbseBoards: boolean, exam: 'main'|'advanced'|'both', advancedOnly: boolean, flashcards: Flashcard[], quizzes: Quiz[] }} Topic
 */

const AppStateContext = createContext(null);
const VALID_EXAMS = new Set(["main", "advanced", "both"]);

function requireText(value, field, itemIndex) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Topic ${itemIndex + 1} is missing a valid ${field}.`);
  }
  return value.trim();
}

function normalizeFlashcard(card, topicIndex, cardIndex) {
  if (!card || typeof card !== "object") {
    throw new Error(`Topic ${topicIndex + 1}, flashcard ${cardIndex + 1} is invalid.`);
  }
  return {
    front: requireText(card.front, "flashcard front", topicIndex),
    back: requireText(card.back, "flashcard back", topicIndex)
  };
}

function normalizeQuiz(quiz, topicIndex, quizIndex) {
  if (!quiz || typeof quiz !== "object") {
    throw new Error(`Topic ${topicIndex + 1}, quiz ${quizIndex + 1} is invalid.`);
  }
  if (!Array.isArray(quiz.options) || quiz.options.length !== 4 || quiz.options.some((option) => typeof option !== "string" || !option.trim())) {
    throw new Error(`Topic ${topicIndex + 1}, quiz ${quizIndex + 1} must have exactly four text options.`);
  }
  if (!Number.isInteger(quiz.correctAnswer) || quiz.correctAnswer < 0 || quiz.correctAnswer > 3) {
    throw new Error(`Topic ${topicIndex + 1}, quiz ${quizIndex + 1} needs a correctAnswer index from 0 to 3.`);
  }
  if (!Array.isArray(quiz.optionExplanations) || quiz.optionExplanations.length !== 4 || quiz.optionExplanations.some((item) => typeof item !== "string")) {
    throw new Error(`Topic ${topicIndex + 1}, quiz ${quizIndex + 1} must have four option explanations.`);
  }
  return {
    question: requireText(quiz.question, "quiz question", topicIndex),
    options: quiz.options.map((option) => option.trim()),
    correctAnswer: quiz.correctAnswer,
    optionExplanations: quiz.optionExplanations.map((item) => item.trim()),
    fullExplanation: typeof quiz.fullExplanation === "string" ? quiz.fullExplanation.trim() : ""
  };
}

/** Validate the JSON topic database against the Part 1 data contract. */
export function normalizeTopicData(value) {
  if (!Array.isArray(value)) throw new Error("The topic database must be a JSON array.");
  return value.map((topic, index) => {
    if (!topic || typeof topic !== "object" || Array.isArray(topic)) {
      throw new Error(`Topic ${index + 1} must be an object.`);
    }
    const exam = requireText(topic.exam, "exam", index).toLowerCase();
    if (!VALID_EXAMS.has(exam)) throw new Error(`Topic ${index + 1} has an unsupported exam value.`);
    if (typeof topic.cbseBoards !== "boolean" || typeof topic.advancedOnly !== "boolean") {
      throw new Error(`Topic ${index + 1} must define cbseBoards and advancedOnly as booleans.`);
    }
    if (!Array.isArray(topic.flashcards) || !Array.isArray(topic.quizzes)) {
      throw new Error(`Topic ${index + 1} must include flashcards and quizzes arrays.`);
    }
    return {
      id: requireText(topic.id, "id", index),
      subject: requireText(topic.subject, "subject", index),
      unit: requireText(topic.unit, "unit", index),
      name: requireText(topic.name, "name", index),
      classLevel: requireText(topic.classLevel, "classLevel", index),
      cbseBoards: topic.cbseBoards,
      exam,
      advancedOnly: topic.advancedOnly,
      flashcards: topic.flashcards.map((card, cardIndex) => normalizeFlashcard(card, index, cardIndex)),
      quizzes: topic.quizzes.map((quiz, quizIndex) => normalizeQuiz(quiz, index, quizIndex))
    };
  });
}

/** Mock loader used by the shell; production can keep serving /data.json from Express. */
export async function loadTopicData({ signal } = {}) {
  const response = await fetch("/data.json", {
    signal,
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Could not load study data (${response.status}).`);
  return normalizeTopicData(await response.json());
}

export function DataProvider({ children }) {
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubjectState] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshData = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await loadTopicData({ signal });
      if (!signal?.aborted) setTopics(data);
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError?.message || "Could not load study data.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshData({ signal: controller.signal });
    return () => controller.abort();
  }, [refreshData]);

  const subjects = useMemo(() => [...new Set(topics.map((topic) => topic.subject))].sort(), [topics]);
  const units = useMemo(() => [...new Set(
    topics
      .filter((topic) => !selectedSubject || topic.subject === selectedSubject)
      .map((topic) => topic.unit)
  )].sort(), [topics, selectedSubject]);

  useEffect(() => {
    if (selectedSubject && !subjects.includes(selectedSubject)) setSelectedSubjectState("");
  }, [selectedSubject, subjects]);
  useEffect(() => {
    if (selectedUnit && !units.includes(selectedUnit)) setSelectedUnit("");
  }, [selectedUnit, units]);

  const setSelectedSubject = useCallback((subject) => {
    setSelectedSubjectState(subject || "");
    setSelectedUnit("");
  }, []);

  const filteredTopics = useMemo(() => topics.filter((topic) =>
    (!selectedSubject || topic.subject === selectedSubject) &&
    (!selectedUnit || topic.unit === selectedUnit)
  ), [topics, selectedSubject, selectedUnit]);

  const filteredFlashcards = useMemo(() => filteredTopics.flatMap((topic) =>
    topic.flashcards.map((flashcard, index) => ({ ...flashcard, topicId: topic.id, topicName: topic.name, subject: topic.subject, unit: topic.unit, index }))
  ), [filteredTopics]);
  const filteredQuizzes = useMemo(() => filteredTopics.flatMap((topic) =>
    topic.quizzes.map((quiz, index) => ({ ...quiz, topicId: topic.id, topicName: topic.name, subject: topic.subject, unit: topic.unit, index }))
  ), [filteredTopics]);

  const value = useMemo(() => ({
    topics,
    filteredTopics,
    filteredFlashcards,
    filteredQuizzes,
    subjects,
    units,
    selectedSubject,
    setSelectedSubject,
    selectedUnit,
    setSelectedUnit,
    loading,
    error,
    refreshData
  }), [
    topics,
    filteredTopics,
    filteredFlashcards,
    filteredQuizzes,
    subjects,
    units,
    selectedSubject,
    setSelectedSubject,
    selectedUnit,
    loading,
    error,
    refreshData
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside DataProvider.");
  return context;
}

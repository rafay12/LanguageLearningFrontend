export interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    unitId: number;
    type?: string | null;
    isActive?: boolean;
}

export interface LessonVocabularyLink {
    id: number;
    lessonId: number;
    vocabularyId: number;
    position?: number | null;
    isRequired?: boolean | null;
}

export interface Vocabulary {
    id: number;
    languageId: number;
    word: string;
    normalizedWord?: string | null;
    pronunciation?: string | null;
    partOfSpeech?: string | null;
    definition?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
}

export interface VocabularyTranslation {
    id: number;
    vocabularyId: number;
    languageId: number;
    translation: string;
    normalizedTranslation?: string | null;
}

export interface LessonWord {
    vocabulary: Vocabulary;
    translation: string;
    translations: VocabularyTranslation[];
}

export interface ExerciseOption {
    id: number;
    number: number;
    value: string;
    label?: string | null;
}

export interface Exercise {
    id: number;
    lessonId?: number;
    number: number;
    type: string;
    question: string;
    explanation?: string | null;
    points: number;
    options: ExerciseOption[];
}

export interface LessonProgress {
    id?: number;
    lessonId: number;
    userId?: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    completedAt?: string | null;
}

export interface ExerciseSubmissionResult {
    exerciseId: number;
    correct: boolean;
    score: number;
    maxScore: number;
    explanation?: string | null;
    attemptId?: number;
}
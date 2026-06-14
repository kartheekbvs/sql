'use client';
import { create } from 'zustand';

interface LearningStore {
  currentTopicId: string;
  setCurrentTopic: (id: string) => void;
  completedTopics: string[];
  toggleComplete: (id: string) => void;
  isCompleted: (id: string) => boolean;
  getProgress: () => number;

  currentProblemId: string | null;
  setCurrentProblem: (id: string) => void;
  completedProblems: string[];
  toggleProblemComplete: (id: string) => void;
  isProblemCompleted: (id: string) => boolean;
  getProblemProgress: () => number;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mode: 'learn' | 'practice';
  setMode: (mode: 'learn' | 'practice') => void;
  practiceFilter: 'all' | 'Easy' | 'Medium' | 'Hard';
  setPracticeFilter: (f: 'all' | 'Easy' | 'Medium' | 'Hard') => void;
  practiceCategory: string;
  setPracticeCategory: (c: string) => void;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  currentTopicId: '1.1',
  setCurrentTopic: (id) => set({ currentTopicId: id }),
  completedTopics: [],
  toggleComplete: (id) => {
    const { completedTopics } = get();
    if (completedTopics.includes(id)) {
      set({ completedTopics: completedTopics.filter((t) => t !== id) });
    } else {
      set({ completedTopics: [...completedTopics, id] });
    }
  },
  isCompleted: (id) => get().completedTopics.includes(id),
  getProgress: () => {
    const { completedTopics } = get();
    return Math.round((completedTopics.length / 108) * 100);
  },

  currentProblemId: null,
  setCurrentProblem: (id) => set({ currentProblemId: id }),
  completedProblems: [],
  toggleProblemComplete: (id) => {
    const { completedProblems } = get();
    if (completedProblems.includes(id)) {
      set({ completedProblems: completedProblems.filter((p) => p !== id) });
    } else {
      set({ completedProblems: [...completedProblems, id] });
    }
  },
  isProblemCompleted: (id) => get().completedProblems.includes(id),
  getProblemProgress: () => {
    const { completedProblems } = get();
    return Math.round((completedProblems.length / 215) * 100);
  },

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  mode: 'learn',
  setMode: (mode) => set({ mode }),
  practiceFilter: 'all',
  setPracticeFilter: (f) => set({ practiceFilter: f }),
  practiceCategory: 'all',
  setPracticeCategory: (c) => set({ practiceCategory: c }),
}));

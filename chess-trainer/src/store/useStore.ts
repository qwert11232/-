import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Progress { box: number; due: number; done: number; lastMistakes: number }
const DAY = 864e5;
const INTERVALS = [1, 2, 4, 8, 16, 32]; // дни до повторения по «коробке» (упрощённая система Лейтнера)
const day = (t: number) => new Date(t).toISOString().slice(0, 10);

interface State {
  xp: number; streak: number; lastDay: string;
  progress: Record<string, Progress>;
  completeOpening: (id: string, mistakes: number, gain: number) => void;
}

// persist сохраняет состояние в localStorage (бэкенд не нужен)
export const useStore = create<State>()(persist((set, get) => ({
  xp: 0, streak: 0, lastDay: '', progress: {},
  completeOpening: (id, mistakes, gain) => {
    const s = get(), p = s.progress[id];
    // без ошибок — коробка растёт (реже повторяем), с ошибками — сброс в 0 (повторяем завтра)
    const box = mistakes === 0 ? Math.min((p?.box ?? 0) + 1, 5) : 0;
    const now = Date.now();
    const streak = s.lastDay === day(now) ? s.streak : s.lastDay === day(now - DAY) ? s.streak + 1 : 1;
    set({
      xp: s.xp + gain, streak, lastDay: day(now),
      progress: { ...s.progress, [id]: { box, due: now + INTERVALS[box] * DAY, done: (p?.done ?? 0) + 1, lastMistakes: mistakes } },
    });
  },
}), { name: 'chess-trainer-v1' }));

// Уровень L начинается с 50·(L-1)² XP
export const levelInfo = (xp: number) => {
  const lvl = Math.floor(Math.sqrt(xp / 50)) + 1, lo = 50 * (lvl - 1) ** 2, hi = 50 * lvl ** 2;
  return { lvl, pct: ((xp - lo) / (hi - lo)) * 100, next: hi - xp };
};

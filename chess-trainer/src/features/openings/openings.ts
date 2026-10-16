import raw from '../../data/openings.json';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export interface Opening {
  id: string; name: string; eco: string;
  side: 'w' | 'b';                 // за кого учим дебют
  difficulty: Difficulty;
  idea: string; typicalPlans: string[];
  moves: [san: string, comment: string][]; // полная линия, ходы обеих сторон
  traps: { moves: string; description: string }[];
  source: string;                  // "AI-generated" — тексты надо проверить вручную
}
export const OPENINGS = raw as unknown as Opening[];

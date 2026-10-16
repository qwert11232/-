import { useState } from 'react';
import { OPENINGS, Opening, Difficulty } from './features/openings/openings';
import OpeningTrainer from './features/openings/OpeningTrainer';
import { useStore, levelInfo } from './store/useStore';

const LABEL: Record<Difficulty, string> = { beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' };

export default function App() {
  const [cur, setCur] = useState<Opening | null>(null);
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const { xp, streak, progress } = useStore();
  const { lvl, pct, next } = levelInfo(xp);
  const rec: Difficulty = lvl < 3 ? 'beginner' : lvl < 6 ? 'intermediate' : 'advanced'; // рекомендация по уровню
  const isDue = (id: string) => !!progress[id] && progress[id].due <= Date.now();
  const status = (id: string) => (!progress[id] ? 'не начат' : progress[id].box >= 3 ? 'изучен' : 'в процессе');
  const list = OPENINGS.filter(o => filter === 'all' || o.difficulty === filter)
    .sort((a, b) => Number(isDue(b.id)) - Number(isDue(a.id)));

  return (
    <>
      <header className="top">
        <strong>Дебютный тренер</strong>
        <span>Уровень {lvl}</span>
        <div className="xp" title={`До следующего уровня: ${next} XP`}><i style={{ width: pct + '%' }} /></div>
        <span>{xp} XP</span>
        <span>Серия: {streak} дн.</span>
      </header>
      <main>
        {cur ? <OpeningTrainer o={cur} onExit={() => setCur(null)} /> : (
          <>
            <div className="row">
              <h1>Дебюты</h1>
              <select value={filter} onChange={e => setFilter(e.target.value as Difficulty | 'all')}>
                <option value="all">Любая сложность</option>
                {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <ul className="list">
              {list.map(o => (
                <li key={o.id}><button onClick={() => setCur(o)}>
                  <b>{o.name}</b> <small>{o.eco} · за {o.side === 'w' ? 'белых' : 'чёрных'}</small>
                  <span>{LABEL[o.difficulty]}, {status(o.id)}
                    {o.difficulty === rec && ' — рекомендуем'}{isDue(o.id) && ' — пора повторить'}</span>
                </button></li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

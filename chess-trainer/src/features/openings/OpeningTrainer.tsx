import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Opening } from './openings';
import { useStore } from '../../store/useStore';

const XP = { beginner: 30, intermediate: 50, advanced: 80 };
const GREEN = '#3fb95099', RED = '#e5534b99', BLUE = '#58a6ff99', YELLOW = '#e3b34166';
type Sq = Record<string, CSSProperties>;
const mark = (a: string, b: string, c: string): Sq => ({ [a]: { background: c }, [b]: { background: c } });

export default function OpeningTrainer({ o, onExit }: { o: Opening; onExit: () => void }) {
  const game = useRef(new Chess());
  const timer = useRef<number>();
  const mist = useRef(0); // ref, чтобы таймеры видели актуальное число ошибок
  const [fen, setFen] = useState(game.current.fen());
  const [idx, setIdx] = useState(0);       // сколько полуходов линии пройдено
  const [mistakes, setMistakes] = useState(0);
  const [note, setNote] = useState('Ваш ход.');
  const [sq, setSq] = useState<Sq>({});
  const [hint, setHint] = useState(0);
  const [gain, setGain] = useState<number | null>(null);
  const complete = useStore(s => s.completeOpening);
  const done = gain !== null;

  const bump = () => { mist.current++; setMistakes(mist.current); };

  const finish = () => {
    const g = Math.max(10, XP[o.difficulty] - 5 * mist.current); // штраф за ошибки
    complete(o.id, mist.current, g);
    setGain(g);
  };

  // Двигаем линию вперёд: если сейчас ход соперника — отвечаем по теории
  const advance = (i: number) => {
    setIdx(i);
    if (i >= o.moves.length) return finish();
    if (game.current.turn() === o.side) return; // ход ученика
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const [san, c] = o.moves[i];
      const m = game.current.move(san);
      setFen(game.current.fen());
      setNote(`Соперник: ${san}${c ? ' — ' + c : ''}`);
      setSq(mark(m.from, m.to, YELLOW));
      advance(i + 1);
    }, 450);
  };

  const reset = () => {
    clearTimeout(timer.current);
    game.current = new Chess(); mist.current = 0;
    setFen(game.current.fen()); setMistakes(0); setHint(0); setGain(null); setSq({}); setNote('Ваш ход.');
    advance(0);
  };
  useEffect(() => { reset(); return () => clearTimeout(timer.current); }, [o.id]);

  const onDrop = (from: string, to: string) => {
    const g = game.current;
    if (done || idx >= o.moves.length || g.turn() !== o.side) return false;
    const [san, comment] = o.moves[idx];
    let played = '';
    try { played = new Chess(g.fen()).move({ from, to, promotion: 'q' }).san; } catch { return false; }
    if (played !== san) {                       // неверный ход: красная подсветка, фигура возвращается
      setSq(mark(from, to, RED)); bump();
      setNote('✗ Это не теоретический ход. Попробуйте ещё раз или возьмите подсказку.');
      return false;
    }
    g.move(san);                                // верный ход: зелёная подсветка + объяснение
    setFen(g.fen()); setSq(mark(from, to, GREEN)); setHint(0);
    setNote(`✓ ${san}${comment ? ' — ' + comment : ''}`);
    advance(idx + 1);
    return true;
  };

  // Подсказка в два шага: сначала поле фигуры, потом сам ход (второй шаг считается ошибкой)
  const showHint = () => {
    if (done || game.current.turn() !== o.side) return;
    const m = new Chess(game.current.fen()).move(o.moves[idx][0]);
    if (hint === 0) setSq({ [m.from]: { background: BLUE } });
    else { setSq(mark(m.from, m.to, BLUE)); setNote(`Теоретический ход: ${m.san}`); bump(); }
    setHint(hint + 1);
  };

  return (
    <div className="trainer">
      <div className="board">
        <Chessboard position={fen} onPieceDrop={onDrop} customSquareStyles={sq}
          boardOrientation={o.side === 'w' ? 'white' : 'black'}
          customDarkSquareStyle={{ backgroundColor: '#6f8fa5' }} customLightSquareStyle={{ backgroundColor: '#e6ecf0' }} />
      </div>
      <aside className="panel">
        <button className="link" onClick={onExit}>← К списку дебютов</button>
        <h2>{o.name} <small>{o.eco}</small></h2>
        <progress value={idx} max={o.moves.length} />
        <p className="note">{note}</p>
        {!done ? (
          <div className="row"><button onClick={showHint}>Подсказка</button><button className="ghost" onClick={reset}>Начать сначала</button></div>
        ) : (
          <div className="summary">
            <h3>Линия пройдена: +{gain} XP, ошибок: {mistakes}</h3>
            <p>{o.idea}</p>
            <ul>{o.typicalPlans.map(p => <li key={p}>{p}</li>)}</ul>
            {o.traps.map(t => <p key={t.moves}><b>Ловушка.</b> {t.moves}<br />{t.description}</p>)}
            <button onClick={reset}>Повторить линию</button>
          </div>
        )}
      </aside>
    </div>
  );
}

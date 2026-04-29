import { useCallback, useEffect, useMemo, useState } from 'react';

/** Curated 5-letter word list. Mix of common and legal-tinged words. */
const WORDS: ReadonlyArray<string> = [
  'BRIEF', 'COURT', 'JUDGE', 'CLAIM', 'RIGHT', 'TRUST', 'WAIVE', 'PROXY',
  'GRANT', 'DEEDS', 'ALIBI', 'AGENT', 'BREVE', 'CIVIL', 'CRIME', 'DEMUR',
  'EQUAL', 'EQUITY', 'GUARD', 'HOUSE', 'LEASE', 'MINOR', 'OATHS', 'ORDER',
  'PLEAD', 'POWER', 'QUASH', 'REPLY', 'SEIZE', 'SERVE', 'SUITS', 'THEFT',
  'TITLE', 'VENUE', 'WAIVE', 'WRITS', 'AUDIT', 'BANK', 'BOUND', 'CLEAR',
  'DRAFT', 'FORTH', 'FRAUD', 'ISSUE', 'LEGAL', 'LIBEL', 'MERIT', 'NOTES',
  'PARTY', 'PROOF', 'RULES', 'STAND', 'TENOR', 'TRIAL', 'VALID', 'WROTE',
].filter((w) => w.length === 5);

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

function gradeGuess(guess: string, target: string): LetterState[] {
  const out: LetterState[] = Array(5).fill('absent');
  const targetArr = target.split('');
  // First pass: correct
  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetArr[i]) {
      out[i] = 'correct';
      targetArr[i] = '_';
    }
  }
  // Second pass: present
  for (let i = 0; i < 5; i++) {
    if (out[i] === 'correct') continue;
    const idx = targetArr.indexOf(guess[i]);
    if (idx >= 0) {
      out[i] = 'present';
      targetArr[idx] = '_';
    }
  }
  return out;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export default function Wordle() {
  const [target] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [done, setDone] = useState<'won' | 'lost' | null>(null);

  const submit = useCallback(() => {
    if (current.length !== 5 || done) return;
    const next = [...guesses, current];
    setGuesses(next);
    if (current === target) setDone('won');
    else if (next.length >= 6) setDone('lost');
    setCurrent('');
  }, [current, done, guesses, target]);

  function pressKey(k: string) {
    if (done) return;
    if (k === 'ENTER') submit();
    else if (k === 'BACK') setCurrent((c) => c.slice(0, -1));
    else if (/^[A-Z]$/.test(k) && current.length < 5) setCurrent((c) => c + k);
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (done) return;
      if (e.key === 'Enter') submit();
      else if (e.key === 'Backspace') setCurrent((c) => c.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && current.length < 5)
        setCurrent((c) => c + e.key.toUpperCase());
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, done, submit]);

  const grades = useMemo(() => guesses.map((g) => gradeGuess(g, target)), [guesses, target]);

  // Best-known state per letter for keyboard coloring
  const letterStates = useMemo(() => {
    const map: Record<string, LetterState> = {};
    grades.forEach((row, gi) => {
      const guess = guesses[gi];
      for (let i = 0; i < 5; i++) {
        const cur = map[guess[i]];
        const next = row[i];
        if (cur === 'correct') continue;
        if (cur === 'present' && next === 'absent') continue;
        map[guess[i]] = next;
      }
    });
    return map;
  }, [grades, guesses]);

  function reset() {
    window.location.reload();
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 select-none">
      <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-navy/60 mb-1">
        Diligence Exercise · Daily Term Identifier
      </p>
      <h2 className="font-serif text-navy text-xl font-bold mb-6">Term Identifier</h2>

      <div className="grid grid-rows-6 gap-1.5 mb-6">
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="flex gap-1.5">
            {Array.from({ length: 5 }).map((__, col) => {
              const guess = guesses[row];
              const grade = grades[row]?.[col];
              const isActive = row === guesses.length && col < current.length;
              const ch = guess?.[col] ?? (isActive ? current[col] : '');
              const cls =
                grade === 'correct'
                  ? 'bg-green-600 text-white border-green-600'
                  : grade === 'present'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : grade === 'absent'
                      ? 'bg-text-muted/40 text-white border-text-muted/40'
                      : isActive
                        ? 'border-navy/50 bg-white'
                        : 'border-border bg-white';
              return (
                <div
                  key={col}
                  className={`w-12 h-12 border-2 flex items-center justify-center font-serif text-lg font-bold uppercase ${cls}`}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {done && (
        <div className="mb-4 text-center">
          <p className="font-serif text-navy text-base">
            {done === 'won' ? 'Diligence satisfied.' : `Term was: ${target}`}
          </p>
          <button
            onClick={reset}
            className="mt-2 text-[10px] font-sans uppercase tracking-wider text-blue-600 hover:underline"
          >
            New exercise
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map((k) => {
              const state = letterStates[k];
              const cls =
                state === 'correct'
                  ? 'bg-green-600 text-white'
                  : state === 'present'
                    ? 'bg-yellow-500 text-white'
                    : state === 'absent'
                      ? 'bg-text-muted/40 text-white'
                      : 'bg-cream text-text-main';
              const w = k === 'ENTER' || k === 'BACK' ? 'px-2.5' : 'w-7';
              return (
                <button
                  key={k}
                  onClick={() => pressKey(k)}
                  className={`${w} h-8 rounded text-[11px] font-sans font-semibold ${cls}`}
                >
                  {k === 'BACK' ? '⌫' : k}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

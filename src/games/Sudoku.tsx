import { useEffect, useMemo, useState } from 'react';

/** Tiny pool of pre-made Sudoku puzzles. 0 = empty. */
const PUZZLES: ReadonlyArray<string> = [
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  '300200000000107000706030500070009080900020004010800050009040301000702000000008006',
  '040000179002008003006307008000000040170000028050000000400106200800400900219000060',
  '100020000020600003003001070030400000007000900000003040040800300600009010000050008',
];

const SOLUTIONS: ReadonlyArray<string> = [
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  '358246971492157863716839524673459182985321674214867359829674315146783295537912486',
  '548926173912458763736317528823175649176849328459632817497186235385264971219573486',
  '198327645524685913763941872236478591857162934419853267145896327672319458381254176',
];

type Cell = { value: number; given: boolean };

function parsePuzzle(s: string): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < 9; c++) {
      const v = parseInt(s[r * 9 + c], 10);
      row.push({ value: v, given: v !== 0 });
    }
    grid.push(row);
  }
  return grid;
}

export default function Sudoku() {
  const [idx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const solution = SOLUTIONS[idx];
  const [grid, setGrid] = useState<Cell[][]>(() => parsePuzzle(PUZZLES[idx]));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const isSolved = useMemo(() => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value !== parseInt(solution[r * 9 + c], 10)) return false;
      }
    }
    return true;
  }, [grid, solution]);

  function setValue(r: number, c: number, v: number) {
    setGrid((prev) => {
      if (prev[r][c].given) return prev;
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[r][c].value = v;
      return next;
    });
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!selected) return;
      if (/^[1-9]$/.test(e.key)) setValue(selected.r, selected.c, parseInt(e.key, 10));
      else if (e.key === 'Backspace' || e.key === '0') setValue(selected.r, selected.c, 0);
      else if (e.key === 'ArrowUp') setSelected((s) => s && { ...s, r: Math.max(0, s.r - 1) });
      else if (e.key === 'ArrowDown') setSelected((s) => s && { ...s, r: Math.min(8, s.r + 1) });
      else if (e.key === 'ArrowLeft') setSelected((s) => s && { ...s, c: Math.max(0, s.c - 1) });
      else if (e.key === 'ArrowRight') setSelected((s) => s && { ...s, c: Math.min(8, s.c + 1) });
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  return (
    <div className="flex flex-col items-center justify-center py-8 select-none">
      <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-navy/60 mb-1">
        Diligence Exercise · Logical Reasoning Drill
      </p>
      <h2 className="font-serif text-navy text-xl font-bold mb-6">Logical Reasoning Drill</h2>

      <div className="inline-block border-2 border-navy">
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isSelected = selected?.r === r && selected?.c === c;
              const correct = cell.value === parseInt(solution[r * 9 + c], 10);
              const wrong = cell.value !== 0 && !correct && !cell.given;
              return (
                <button
                  key={c}
                  onClick={() => setSelected({ r, c })}
                  className={`w-9 h-9 border border-border flex items-center justify-center font-serif text-base ${
                    cell.given ? 'text-navy font-bold bg-cream/40' : wrong ? 'text-red-600' : 'text-text-main'
                  } ${isSelected ? 'bg-gold/20' : ''} ${
                    (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-navy' : ''
                  } ${(r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-navy' : ''}`}
                >
                  {cell.value === 0 ? '' : cell.value}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {isSolved && (
        <p className="mt-4 font-serif text-navy text-base">Diligence satisfied. ✓</p>
      )}

      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => selected && setValue(selected.r, selected.c, n)}
            className="w-8 h-8 bg-cream border border-border rounded font-serif text-sm hover:bg-gold/20"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => selected && setValue(selected.r, selected.c, 0)}
          className="w-12 h-8 bg-cream border border-border rounded text-[10px] font-sans hover:bg-red-100"
        >
          Clear
        </button>
      </div>

      <p className="mt-4 text-[10px] font-sans text-text-muted/70">
        Click a cell, then press 1–9 or use the keypad. Arrow keys to navigate.
      </p>
    </div>
  );
}

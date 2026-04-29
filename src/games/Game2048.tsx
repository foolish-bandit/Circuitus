import { useCallback, useEffect, useState } from 'react';

type Board = number[][];
const SIZE = 4;

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function clone(b: Board): Board {
  return b.map((row) => [...row]);
}

function spawn(b: Board): Board {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) empties.push([r, c]);
    }
  }
  if (empties.length === 0) return b;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = clone(b);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function compactRow(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      gained += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < SIZE) filtered.push(0);
  return { row: filtered, gained };
}

function move(b: Board, dir: 'L' | 'R' | 'U' | 'D'): { board: Board; gained: number; moved: boolean } {
  let board = clone(b);
  let gained = 0;

  if (dir === 'R' || dir === 'D') {
    if (dir === 'D') board = transpose(board);
    board = board.map((row) => row.reverse());
  } else if (dir === 'U') {
    board = transpose(board);
  }

  const before = JSON.stringify(board);
  board = board.map((row) => {
    const r = compactRow(row);
    gained += r.gained;
    return r.row;
  });
  const moved = JSON.stringify(board) !== before;

  if (dir === 'R' || dir === 'D') {
    board = board.map((row) => row.reverse());
    if (dir === 'D') board = transpose(board);
  } else if (dir === 'U') {
    board = transpose(board);
  }

  return { board, gained, moved };
}

function transpose(b: Board): Board {
  const out = emptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      out[c][r] = b[r][c];
    }
  }
  return out;
}

function canMove(b: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) return true;
      if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
      if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
    }
  }
  return false;
}

const TILE_BG: Record<number, string> = {
  0: 'bg-paper-warm',
  2: 'bg-paper text-ink',
  4: 'bg-paper-cool text-ink',
  8: 'bg-rule text-ink',
  16: 'bg-rule-strong text-paper',
  32: 'bg-brass-dim text-paper',
  64: 'bg-brass text-paper',
  128: 'bg-brass-bright text-ink',
  256: 'bg-claret text-paper',
  512: 'bg-claret-dark text-paper',
  1024: 'bg-navy-light text-brass-bright',
  2048: 'bg-navy text-brass-bright',
};

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => spawn(spawn(emptyBoard())));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const handleMove = useCallback(
    (dir: 'L' | 'R' | 'U' | 'D') => {
      if (over) return;
      const result = move(board, dir);
      if (!result.moved) return;
      const next = spawn(result.board);
      setBoard(next);
      setScore((s) => s + result.gained);
      if (!canMove(next)) setOver(true);
    },
    [board, over],
  );

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const map: Record<string, 'L' | 'R' | 'U' | 'D' | undefined> = {
        ArrowLeft: 'L',
        ArrowRight: 'R',
        ArrowUp: 'U',
        ArrowDown: 'D',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  function reset() {
    setBoard(spawn(spawn(emptyBoard())));
    setScore(0);
    setOver(false);
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 select-none">
      <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-navy/60 mb-1">
        Diligence Exercise · Settlement Calculator
      </p>
      <h2 className="font-serif text-navy text-xl font-bold mb-1">Settlement Calculator</h2>
      <div className="flex items-center gap-4 mb-5">
        <span className="text-[10px] font-mono text-text-muted">
          Score: <span className="text-navy">{score.toLocaleString()}</span>
        </span>
        <button
          onClick={reset}
          className="text-[10px] font-sans uppercase tracking-wider text-blue-600 hover:underline"
        >
          New Calculation
        </button>
      </div>

      <div className="bg-navy p-2 rounded">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((v, c) => (
              <div
                key={c}
                className={`w-16 h-16 m-1 rounded flex items-center justify-center font-serif text-xl font-bold ${TILE_BG[v] ?? 'bg-navy-dark text-gold'}`}
              >
                {v === 0 ? '' : v}
              </div>
            ))}
          </div>
        ))}
      </div>

      {over && (
        <p className="mt-4 font-serif text-navy text-base">
          Calculation complete. Final score: {score.toLocaleString()}.
        </p>
      )}

      <p className="mt-4 text-[10px] font-sans text-text-muted/70">
        Arrow keys to merge. Reach 2,048 to satisfy the diligence threshold.
      </p>
    </div>
  );
}

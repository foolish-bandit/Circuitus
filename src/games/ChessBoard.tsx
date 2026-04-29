import { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

/**
 * Simple two-player local chess. The "Strategy Module" — useful as a
 * legitimately educational cover. The user can play themselves or
 * walk through openings without an AI.
 */
export default function ChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [position, setPosition] = useState(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('White to move');

  function refreshStatus() {
    if (game.isCheckmate()) setStatus(`Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
    else if (game.isDraw()) setStatus('Draw.');
    else if (game.inCheck()) setStatus(`${game.turn() === 'w' ? 'White' : 'Black'} in check.`);
    else setStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);
  }

  function onPieceDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean {
    if (!targetSquare) return false;
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;
      setPosition(game.fen());
      setHistory((h) => [...h, move.san]);
      refreshStatus();
      return true;
    } catch {
      return false;
    }
  }

  function reset() {
    game.reset();
    setPosition(game.fen());
    setHistory([]);
    setStatus('White to move');
  }

  function undo() {
    game.undo();
    setPosition(game.fen());
    setHistory((h) => h.slice(0, -1));
    refreshStatus();
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 select-none">
      <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-navy/60 mb-1">
        Diligence Exercise · Strategic Reasoning Module
      </p>
      <h2 className="font-serif text-navy text-xl font-bold mb-4">Strategic Reasoning Module</h2>

      <div className="flex gap-6">
        <div style={{ width: 420 }}>
          <Chessboard
            options={{
              position,
              onPieceDrop,
              boardStyle: { borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
            }}
          />
        </div>
        <div className="w-56 flex flex-col">
          <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-text-muted mb-2">
            Move Log
          </p>
          <div className="flex-1 max-h-[400px] overflow-y-auto bg-cream border border-border rounded p-2">
            <ol className="text-[11px] font-mono space-y-0.5">
              {history.map((m, i) => (
                <li key={i} className="text-text-main">
                  {Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '...'} {m}
                </li>
              ))}
              {history.length === 0 && (
                <li className="text-text-muted/60">No moves yet.</li>
              )}
            </ol>
          </div>
          <p className="text-[10px] font-mono text-navy mt-2">{status}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={undo}
              className="flex-1 text-[10px] font-sans uppercase tracking-wider text-text-muted hover:text-navy border border-border rounded py-1"
            >
              Undo
            </button>
            <button
              onClick={reset}
              className="flex-1 text-[10px] font-sans uppercase tracking-wider text-blue-600 hover:underline border border-border rounded py-1"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

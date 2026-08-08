"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// --- Simplified Ludo rules --------------------------------------------
// 4 players around one 52-cell shared ring. Each token's progress is a
// single "steps" counter: 0 = still home, 1-51 = on the ring (absolute
// ring cell = (player.startOffset + steps - 1) % 52), 52-57 = that
// player's own home stretch, 58 = finished (reached the centre).
// A 6 grants an extra roll. Landing exactly on an opponent (on a
// non-safe ring cell) sends that opponent's token back to base.
// This is a fun simplified version, not the full official rulebook
// (no "exact count to finish" requirement) — built for quick local
// pass-and-play games between rounds in a room.

const COLORS = [
  { id: "red", name: "Red", hex: "#ef4444", startOffset: 0 },
  { id: "blue", name: "Blue", hex: "#3b82f6", startOffset: 13 },
  { id: "yellow", name: "Yellow", hex: "#eab308", startOffset: 26 },
  { id: "green", name: "Green", hex: "#22c55e", startOffset: 39 },
];
const RING_SIZE = 52;
const SAFE_CELLS = new Set(COLORS.map((c) => c.startOffset));
const TOKENS_PER_PLAYER = 4;
const HOME_STRETCH_START = 52;
const FINISHED = 58;

function initialTokens() {
  return COLORS.map(() => Array(TOKENS_PER_PLAYER).fill(0));
}

function ringPosition(player, steps) {
  return (player.startOffset + steps - 1 + RING_SIZE) % RING_SIZE;
}

export default function LudoGamePage() {
  const [numPlayers, setNumPlayers] = useState(4);
  const [tokens, setTokens] = useState(initialTokens());
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState("Roll the dice to start!");
  const [winner, setWinner] = useState(null);

  const activePlayers = COLORS.slice(0, numPlayers);
  const current = activePlayers[turn];

  const movable = useMemo(() => {
    if (dice == null || !current) return [];
    const myTokens = tokens[turn];
    return myTokens
      .map((steps, i) => ({ i, steps }))
      .filter(({ steps }) => {
        if (steps === FINISHED) return false;
        if (steps === 0) return dice === 6; // needs a 6 to leave home
        return steps + dice <= FINISHED;
      })
      .map(({ i }) => i);
  }, [dice, tokens, turn, current]);

  function nextTurn(grantExtra) {
    setDice(null);
    if (!grantExtra) {
      setTurn((t) => (t + 1) % numPlayers);
    }
  }

  function rollDice() {
    if (rolling || winner) return;
    setRolling(true);
    setTimeout(() => {
      const val = 1 + Math.floor(Math.random() * 6);
      setDice(val);
      setRolling(false);
      // Check if any move is possible after a tick (movable recomputes via effect-like memo)
      setTimeout(() => {
        const myTokens = tokens[turn];
        const canMove = myTokens.some((steps) => {
          if (steps === FINISHED) return false;
          if (steps === 0) return val === 6;
          return steps + val <= FINISHED;
        });
        if (!canMove) {
          setMessage(`${current.name} has no valid move. Turn skipped.`);
          nextTurn(val === 6);
        } else {
          setMessage(`${current.name} rolled a ${val} — pick a token to move.`);
        }
      }, 0);
    }, 500);
  }

  function moveToken(tokenIndex) {
    if (dice == null || !movable.includes(tokenIndex)) return;
    setTokens((prev) => {
      const next = prev.map((arr) => [...arr]);
      const steps = next[turn][tokenIndex];
      const newSteps = steps === 0 ? 1 : steps + dice;
      next[turn][tokenIndex] = newSteps;

      // Capture check — only on the shared ring, not home stretch/safe cells.
      if (newSteps >= 1 && newSteps < HOME_STRETCH_START) {
        const landedCell = ringPosition(current, newSteps);
        if (!SAFE_CELLS.has(landedCell)) {
          activePlayers.forEach((p, pIdx) => {
            if (pIdx === turn) return;
            next[pIdx] = next[pIdx].map((s) => {
              if (s >= 1 && s < HOME_STRETCH_START && ringPosition(p, s) === landedCell) {
                setMessage(`${current.name} captured ${p.name}'s token! 💥`);
                return 0;
              }
              return s;
            });
          });
        }
      }

      const wonAll = next[turn].every((s) => s === FINISHED);
      if (wonAll) {
        setWinner(current);
        setMessage(`🏆 ${current.name} wins!`);
      }
      return next;
    });

    const grantExtra = dice === 6;
    if (!winner) {
      setMessage((m) => (dice === 6 ? `${current.name} rolled a 6 — roll again!` : m));
      nextTurn(grantExtra);
    }
  }

  function resetGame() {
    setTokens(initialTokens());
    setTurn(0);
    setDice(null);
    setWinner(null);
    setMessage("Roll the dice to start!");
  }

  // Layout tokens visually as a ring of dots (simplified board, not the
  // official cross-shaped grid) plus each player's home yard.
  const ringCells = Array.from({ length: RING_SIZE });

  return (
    <main className="min-h-screen bg-void pb-16">
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/rooms" className="text-ink text-lg">‹</Link>
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">Ludo</h1>
            <p className="text-xs text-ink/80">Local pass &amp; play — take turns on this device</p>
          </div>
        </div>
      </section>

      {!winner && (
        <div className="mx-5 mt-4 flex items-center justify-between rounded-xl bg-panel px-4 py-3 ring-1 ring-white/5">
          <span className="text-xs text-mist">Players</span>
          <div className="flex gap-2">
            {[2, 4].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setNumPlayers(n);
                  resetGame();
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  numPlayers === n ? "bg-glow-gradient text-ink" : "bg-panel2 text-mist"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Board — simplified ring layout */}
      <div className="relative mx-auto mt-6 h-[300px] w-[300px]">
        <div className="absolute inset-0 rounded-full ring-2 ring-white/10" />
        {ringCells.map((_, cell) => {
          const angle = (cell / RING_SIZE) * 2 * Math.PI;
          const r = 140;
          const x = 150 + r * Math.cos(angle) - 8;
          const y = 150 + r * Math.sin(angle) - 8;
          const isSafe = SAFE_CELLS.has(cell);
          return (
            <div
              key={cell}
              className={`absolute h-4 w-4 rounded-full ${
                isSafe ? "bg-gold/60" : "bg-white/10"
              }`}
              style={{ left: x, top: y }}
            />
          );
        })}
        {/* Tokens on ring */}
        {activePlayers.map((player, pIdx) =>
          tokens[pIdx].map((steps, tIdx) => {
            if (steps === 0 || steps === FINISHED) return null;
            const cell =
              steps < HOME_STRETCH_START ? ringPosition(player, steps) : null;
            if (cell == null) return null; // home stretch tokens not plotted in this simplified view
            const angle = (cell / RING_SIZE) * 2 * Math.PI;
            const r = 140;
            const x = 150 + r * Math.cos(angle) - 8;
            const y = 150 + r * Math.sin(angle) - 8;
            const isMovable = pIdx === turn && movable.includes(tIdx);
            return (
              <button
                key={`${pIdx}-${tIdx}`}
                onClick={() => pIdx === turn && moveToken(tIdx)}
                className={`absolute h-5 w-5 rounded-full border-2 border-white/60 shadow ${
                  isMovable ? "animate-pulse ring-2 ring-white" : ""
                }`}
                style={{ left: x - 2, top: y - 2, background: player.hex }}
                aria-label={`${player.name} token ${tIdx + 1}`}
              />
            );
          })
        )}
        {/* Centre */}
        <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-panel text-2xl ring-1 ring-white/10">
          🏁
        </div>
      </div>

      {/* Home yards — tap a home token when you roll a 6 */}
      <div className="mx-5 mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {activePlayers.map((player, pIdx) => (
          <div
            key={player.id}
            className={`rounded-xl p-2 ring-1 ${
              turn === pIdx ? "ring-2 ring-white/60" : "ring-white/5"
            } bg-panel`}
          >
            <p className="text-[10px] font-semibold" style={{ color: player.hex }}>
              {player.name} {turn === pIdx && !winner ? "(turn)" : ""}
            </p>
            <div className="mt-1 flex gap-1.5">
              {tokens[pIdx].map((steps, tIdx) => {
                const atHome = steps === 0;
                const finished = steps === FINISHED;
                const isMovable = pIdx === turn && movable.includes(tIdx) && atHome;
                return (
                  <button
                    key={tIdx}
                    onClick={() => isMovable && moveToken(tIdx)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/40 text-[9px] text-white ${
                      isMovable ? "animate-pulse ring-2 ring-white" : ""
                    }`}
                    style={{ background: player.hex, opacity: finished ? 0.35 : atHome ? 0.5 : 1 }}
                  >
                    {finished ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mx-5 mt-4 text-center text-sm text-mist">{message}</p>

      <div className="mx-5 mt-4 flex flex-col items-center gap-3">
        {winner ? (
          <button
            onClick={resetGame}
            className="rounded-full bg-glow-gradient px-6 py-3 text-sm font-semibold text-ink"
          >
            🔄 Play Again
          </button>
        ) : (
          <button
            onClick={rollDice}
            disabled={rolling || dice != null}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-glow-gradient text-3xl font-extrabold text-ink shadow-glow transition-transform active:scale-95 ${
              rolling ? "animate-spin" : ""
            } disabled:opacity-60`}
          >
            {dice ?? "🎲"}
          </button>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/lib/AuthContext";
import { ThemeContext } from "@/lib/ThemeContext";
import {
  findOrCreateLudoMatch,
  listenToMatch,
  markPlayerReady,
  rollDice,
  makeMove,
  endMatch,
  getUserLudoBalance,
} from "@/lib/ludo";

const BET_AMOUNTS = [5000, 10000, 15000, 20000, 30000, 40000];
const BOARD_SIZE = 15; // 15x15 grid for real Ludo
const HOME_SIZE = 4;

// Real Ludo positions (cross-shaped board)
const SAFE_POSITIONS = [
  { row: 6, col: 1 }, // Red safe
  { row: 1, col: 8 }, // Yellow safe
  { row: 8, col: 14 }, // Blue safe
  { row: 14, col: 6 }, // Green safe
  { row: 6, col: 6 }, // Center
];

const PLAYER_COLORS = [
  { id: "red", name: "Red", hex: "#ef4444", home: { row: 13, col: 13 } },
  { id: "yellow", name: "Yellow", hex: "#eab308", home: { row: 13, col: 1 } },
  { id: "blue", name: "Blue", hex: "#3b82f6", home: { row: 1, col: 13 } },
  { id: "green", name: "Green", hex: "#22c55e", home: { row: 1, col: 1 } },
];

export default function LudoMultiplayerPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);

  const [gamePhase, setGamePhase] = useState("betting"); // betting, waiting, playing, finished
  const [selectedBet, setSelectedBet] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Game state
  const [matchId, setMatchId] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [message, setMessage] = useState("");
  const [winner, setWinner] = useState(null);

  // Fetch user balance
  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const balance = await getUserLudoBalance(user.uid);
      setUserBalance(balance.coins || 0);
    };
    fetchBalance();
  }, [user]);

  // Start matchmaking
  const handleStartMatch = async () => {
    if (!user || !selectedBet) return;
    if (userBalance < selectedBet) {
      setError("Insufficient coins");
      return;
    }

    setLoading(true);
    try {
      const { matchId: id, isHost } = await findOrCreateLudoMatch(
        user.uid,
        user.displayName || "Player",
        user.photoURL || "",
        selectedBet
      );
      setMatchId(id);
      setGamePhase("waiting");
      setMessage(isHost ? "Waiting for opponent..." : "Joined match! Waiting to start...");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen to match updates
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = listenToMatch(matchId, (data) => {
      setMatchData(data);

      // Find this player's index
      const pIdx = data.players.findIndex((p) => p.userId === user.uid);
      setPlayerIndex(pIdx);

      if (data.gameState?.tokens) {
        setTokens(data.gameState.tokens);
        setCurrentTurn(data.gameState.turn);
        setDice(data.gameState.dice);
      }

      if (data.status === "playing") {
        setGamePhase("playing");
        setMessage(
          pIdx === data.gameState.turn
            ? "Your turn! Roll the dice."
            : `${data.players[data.gameState.turn].userName}'s turn`
        );
      }

      if (data.gameState?.winner !== null && data.gameState?.winner !== undefined) {
        const winnerId = data.players[data.gameState.winner].userId;
        setWinner(winnerId);
        setGamePhase("finished");
        setMessage(
          winnerId === user.uid ? "🎉 You won!" : `${data.players[data.gameState.winner].userName} won!`
        );
      }
    });

    return unsubscribe;
  }, [matchId, user]);

  // Mark player ready
  const handleReady = async () => {
    if (!matchId) return;
    await markPlayerReady(matchId, user.uid);
    setMessage("Ready! Waiting for opponent...");
  };

  // Roll dice
  const handleRollDice = async () => {
    if (!matchId || playerIndex !== currentTurn || dice !== null) return;
    setLoading(true);
    try {
      await rollDice(matchId, user.uid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Move token
  const handleMoveToken = async (tokenIndex) => {
    if (!matchId || playerIndex !== currentTurn || dice === null) return;
    setLoading(true);
    try {
      await makeMove(matchId, user.uid, tokenIndex);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render board
  const renderBoard = () => {
    return (
      <div className="relative mx-auto w-full max-w-sm aspect-square bg-panel rounded-lg ring-1 ring-white/10 p-2">
        <div className="grid grid-cols-15 gap-px h-full">
          {Array(BOARD_SIZE * BOARD_SIZE)
            .fill(0)
            .map((_, idx) => {
              const row = Math.floor(idx / BOARD_SIZE);
              const col = idx % BOARD_SIZE;
              const isSafe = SAFE_POSITIONS.some((p) => p.row === row && p.col === col);
              const isHome = PLAYER_COLORS.some((pc) => pc.home.row === row && pc.home.col === col);

              return (
                <div
                  key={idx}
                  className={`w-full aspect-square rounded-sm ${
                    isSafe
                      ? "bg-gold/20 ring-1 ring-gold/40"
                      : isHome
                      ? "bg-blue/10 ring-1 ring-blue/20"
                      : "bg-white/5"
                  }`}
                >
                  {/* Render tokens on this cell */}
                  {tokens && matchData && (
                    <div className="flex items-center justify-center h-full w-full relative">
                      {matchData.players.map((player, pIdx) =>
                        tokens[pIdx]?.map((tokenPos, tokenIdx) => {
                          // Simplified: render token if it's on this board position
                          // In real app, you'd calculate actual board position from tokenPos
                          if (tokenPos > 0 && tokenPos < 53) {
                            const cellIndex = (player.color === "red" ? 0 : player.color === "yellow" ? 13 : player.color === "blue" ? 26 : 39) + tokenPos - 1;
                            if (cellIndex === idx) {
                              return (
                                <button
                                  key={`${pIdx}-${tokenIdx}`}
                                  onClick={() => handleMoveToken(tokenIdx)}
                                  className="h-4 w-4 rounded-full border border-white/60 shadow cursor-pointer hover:ring-2 hover:ring-white"
                                  style={{ background: player.color === "red" ? "#ef4444" : player.color === "yellow" ? "#eab308" : player.color === "blue" ? "#3b82f6" : "#22c55e" }}
                                  disabled={playerIndex !== currentTurn || dice === null}
                                />
                              );
                            }
                          }
                          return null;
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  if (!user) return <div className="text-center text-mist">Loading...</div>;

  return (
    <main className={`min-h-screen pb-20 ${isDark ? "bg-void" : "bg-white"}`}>
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/games/ludo" className="text-ink text-lg">
            ‹
          </Link>
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">Ludo Online</h1>
            <p className="text-xs text-ink/80">Real-time multiplayer with coin betting</p>
          </div>
        </div>
      </section>

      {/* BETTING PHASE */}
      {gamePhase === "betting" && (
        <div className="mx-5 mt-6 space-y-4">
          <div className="rounded-xl bg-panel p-4 ring-1 ring-white/10">
            <p className="text-xs text-mist mb-2">Your Balance</p>
            <p className="text-2xl font-bold text-gold">{userBalance.toLocaleString()} 💰</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink mb-3">Select Bet Amount</p>
            <div className="grid grid-cols-2 gap-2">
              {BET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedBet(amount)}
                  disabled={userBalance < amount}
                  className={`rounded-lg px-4 py-3 font-semibold transition ${
                    selectedBet === amount
                      ? "bg-glow-gradient text-ink"
                      : userBalance < amount
                      ? "bg-panel2 text-mist/50 cursor-not-allowed"
                      : "bg-panel2 text-mist hover:bg-panel ring-1 ring-white/10"
                  }`}
                >
                  {(amount / 1000).toFixed(0)}k 💰
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleStartMatch}
            disabled={!selectedBet || loading}
            className={`w-full rounded-lg px-6 py-4 font-semibold text-ink transition ${
              !selectedBet || loading
                ? "bg-panel2 text-mist/50 cursor-not-allowed"
                : "bg-glow-gradient hover:shadow-glow"
            }`}
          >
            {loading ? "Finding Opponent..." : "🔍 Find Match"}
          </button>
        </div>
      )}

      {/* WAITING PHASE */}
      {gamePhase === "waiting" && matchData && (
        <div className="mx-5 mt-6 space-y-4">
          <div className="rounded-xl bg-panel p-4 ring-1 ring-white/10">
            <p className="text-xs text-mist mb-3">Match Info</p>
            <p className="text-sm text-gold font-semibold mb-2">Bet: {(selectedBet / 1000).toFixed(0)}k 💰</p>
            <p className="text-xs text-mist">Players: {matchData.players.length}/2</p>
          </div>

          <div className="space-y-2">
            {matchData.players.map((player, idx) => (
              <div key={player.userId} className="rounded-lg bg-panel2 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{player.userName}</p>
                  <p className="text-xs text-mist">{player.color}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${player.ready ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {player.ready ? "✓ Ready" : "⏳ Joining"}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleReady}
            className="w-full rounded-lg bg-glow-gradient px-6 py-4 font-semibold text-ink hover:shadow-glow transition"
          >
            ✓ Ready to Play
          </button>

          <p className="text-center text-xs text-mist">{message}</p>
        </div>
      )}

      {/* PLAYING PHASE */}
      {gamePhase === "playing" && matchData && tokens && (
        <div className="mx-5 mt-6 space-y-4">
          {/* Current player info */}
          <div className="rounded-xl bg-panel p-4 ring-1 ring-white/10">
            <p className="text-xs text-mist mb-2">Current Turn</p>
            <p className="text-lg font-bold text-ink">{matchData.players[currentTurn].userName}</p>
            {currentTurn === playerIndex && (
              <p className="text-xs text-gold mt-1">🎮 It's your turn!</p>
            )}
          </div>

          {/* Real Ludo Board */}
          {renderBoard()}

          {/* Dice & Actions */}
          <div className="rounded-xl bg-panel p-4 ring-1 ring-white/10 text-center space-y-3">
            {currentTurn === playerIndex ? (
              <>
                <button
                  onClick={handleRollDice}
                  disabled={dice !== null || loading}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl font-extrabold mx-auto transition ${
                    dice !== null || loading
                      ? "bg-panel2 text-mist/50 cursor-not-allowed"
                      : "bg-glow-gradient text-ink hover:shadow-glow active:scale-95"
                  }`}
                >
                  {dice ?? "🎲"}
                </button>
                {dice !== null && <p className="text-sm text-mist">You rolled {dice}</p>}
              </>
            ) : (
              <p className="text-sm text-mist">Waiting for {matchData.players[currentTurn].userName} to roll...</p>
            )}
          </div>

          {/* Player tokens */}
          <div className="grid grid-cols-2 gap-2">
            {matchData.players.map((player, pIdx) => (
              <div key={player.userId} className="rounded-lg bg-panel2 p-3 ring-1 ring-white/10">
                <p className="text-xs font-semibold text-ink mb-2">{player.userName}</p>
                <div className="flex gap-2">
                  {tokens[pIdx].map((pos, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => pIdx === playerIndex && handleMoveToken(tIdx)}
                      className="h-8 w-8 rounded-full border-2 border-white/40 text-xs font-bold text-white hover:ring-2 hover:ring-white transition"
                      style={{
                        background:
                          player.color === "red"
                            ? "#ef4444"
                            : player.color === "yellow"
                            ? "#eab308"
                            : player.color === "blue"
                            ? "#3b82f6"
                            : "#22c55e",
                        opacity: pos === 0 ? 0.4 : pos === 58 ? 1 : 0.8,
                      }}
                      disabled={pIdx !== playerIndex || dice === null}
                    >
                      {pos === 58 ? "✓" : pos || "-"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-mist">{message}</p>
        </div>
      )}

      {/* FINISHED PHASE */}
      {gamePhase === "finished" && (
        <div className="mx-5 mt-6 space-y-4">
          <div className="rounded-xl bg-panel p-6 ring-1 ring-white/10 text-center">
            <p className="text-4xl mb-3">{winner === user.uid ? "🎉" : "🏆"}</p>
            <p className="text-2xl font-bold text-ink mb-2">{message}</p>
            <p className="text-sm text-gold font-semibold mb-4">
              Prize: {(selectedBet * 2).toLocaleString()} 💰
            </p>
          </div>

          <button
            onClick={() => router.push("/games/ludo")}
            className="w-full rounded-lg bg-glow-gradient px-6 py-4 font-semibold text-ink hover:shadow-glow transition"
          >
            ← Back to Ludo
          </button>
        </div>
      )}
    </main>
  );
}

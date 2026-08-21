import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// 1. Sleek, Compact DailyOrbitDesktop.tsx with all props
const dailyOrbitDesktopCode = `import { useState, type FC } from 'react';
import type { Guess, UserProfile } from '../types/game';
import { Send, HelpCircle, Sparkles, Trophy, Flame, Compass, Radio } from 'lucide-react';

interface DailyOrbitDesktopProps {
  guesses: Guess[];
  currentScore: number;
  unlockedHints: string[];
  solved: boolean;
  loadingGuess: boolean;
  onSubmitGuess: (word: string) => Promise<void>;
  onRequestHint: () => Promise<void>;
  onShowRoast: () => void;
  onOpenStandings?: () => void;
  user?: UserProfile | null;
}

export const DailyOrbitDesktop: FC<DailyOrbitDesktopProps> = ({
  guesses,
  currentScore,
  unlockedHints,
  solved,
  loadingGuess,
  onSubmitGuess,
  onRequestHint,
  onShowRoast,
}) => {
  const [inputWord, setInputWord] = useState('');
  const [hintLoading, setHintLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputWord.trim();
    if (!trimmed || loadingGuess || solved) return;
    setInputWord('');
    await onSubmitGuess(trimmed);
  };

  const handleHintClick = async () => {
    if (hintLoading || unlockedHints.length >= 3 || solved) return;
    try {
      setHintLoading(true);
      await onRequestHint();
    } finally {
      setHintLoading(false);
    }
  };

  // Radar position calculation: map rank to 3D orbit rings
  const getProbePosition = (rank: number, index: number, total: number) => {
    const angle = (index / Math.max(1, total)) * 2 * Math.PI - Math.PI / 2;
    const maxRadius = 140;
    const minRadius = 25;
    const clampedRank = Math.min(1000, Math.max(1, rank));
    const normalizedDist = Math.log10(clampedRank) / 3;
    const radius = minRadius + normalizedDist * (maxRadius - minRadius);

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.65; // Perspective compression
    return { x, y, radius };
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 text-center">
      {/* 3D Holographic Semantic Radar */}
      <div className="relative w-full h-[300px] sm:h-[340px] stitch-card rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.05)]">
        {/* Background Grid & Scanlines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.12)_0%,rgba(5,5,12,0.95)_75%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />

        {/* 3D Perspective Plane */}
        <div 
          className="relative w-[340px] h-[340px] flex items-center justify-center transition-transform duration-700"
          style={{ transform: 'perspective(750px) rotateX(36deg)' }}
        >
          {/* Orbital Rings */}
          <div className="absolute w-[290px] h-[290px] rounded-full border border-[#00f0ff]/15 animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-[210px] h-[210px] rounded-full border border-dashed border-[#ffaa00]/25 animate-[spin_40s_linear_infinite_reverse]" />
          <div className="absolute w-[130px] h-[130px] rounded-full border border-[#ff5e07]/35 animate-[spin_25s_linear_infinite]" />
          <div className="absolute w-[60px] h-[60px] rounded-full border border-[#00ff88]/50 shadow-[0_0_20px_rgba(0,255,136,0.3)] animate-pulse" />

          {/* Center Target Planet */}
          <div className="relative z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-[#00f0ff] to-[#00ff88] p-[2px] shadow-[0_0_25px_rgba(0,240,255,0.8)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#05050c] flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#00f0ff] animate-ping" />
            </div>
            <span className="absolute -bottom-5 font-mono text-[9px] text-[#00f0ff] tracking-widest font-black uppercase whitespace-nowrap">
              TARGET CENTER
            </span>
          </div>

          {/* Render Active Guess Probes */}
          {guesses.slice(-12).map((g, idx, arr) => {
            const { x, y } = getProbePosition(g.rank, idx, arr.length);
            const isTarget = g.rank === 1;
            const isHot = g.rank < 100;
            const isWarm = g.rank < 1000;

            const colorClass = isTarget
              ? 'bg-[#00ff88] text-[#05050c] border-[#00ff88] shadow-[0_0_15px_#00ff88]'
              : isHot
              ? 'bg-[#ff5e07] text-[#eef2ff] border-[#ff5e07] shadow-[0_0_12px_#ff5e07]'
              : isWarm
              ? 'bg-[#ffaa00] text-[#05050c] border-[#ffaa00]'
              : 'bg-[#070714] text-[#00f0ff] border-[#00f0ff]/50';

            return (
              <div
                key={idx}
                className="absolute z-20 transition-all duration-500 flex flex-col items-center pointer-events-auto group cursor-pointer"
                style={{
                  transform: \`translate3d(\${x}px, \${y}px, 0)\`,
                }}
              >
                <div className={\`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1 whitespace-nowrap \${colorClass}\`}>
                  <span>{g.word}</span>
                  <span className="opacity-80">#{g.rank}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Radar HUD Overlay */}
        <div className="absolute top-4 left-5 flex items-center gap-2 font-mono text-xs text-[#00f0ff]">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#00ff88]" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Holographic Orbit // Live</span>
        </div>

        <div className="absolute top-4 right-5 font-mono text-xs text-[#eef2ff] flex items-center gap-2">
          <span className="text-[10px] text-[#8080a0] uppercase">Probes:</span>
          <span className="font-bold text-[#00f0ff]">{guesses.length}</span>
        </div>
      </div>

      {/* Semantic Probe Launch Bar */}
      <form onSubmit={handleSend} className="relative w-full max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-[#00f0ff] pointer-events-none">
            <Compass className="w-5 h-5 animate-spin [animation-duration:12s]" />
          </div>
          <input
            id="probe-word-input"
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            disabled={solved || loadingGuess}
            placeholder={
              solved
                ? "Today's Orbit Solved! Check Standings."
                : "Launch semantic probe word (e.g. guitar, coffee, ocean, whisper)..."
            }
            className="w-full bg-[#070714]/90 border border-white/15 rounded-2xl pl-12 pr-14 py-3.5 font-mono text-xs sm:text-sm text-[#eef2ff] placeholder:text-[#8080a0]/40 uppercase tracking-wider focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all shadow-[0_0_30px_rgba(0,240,255,0.1)]"
          />
          <button
            type="submit"
            disabled={!inputWord.trim() || loadingGuess || solved}
            className="absolute right-2 p-2.5 rounded-xl bg-[#00f0ff] text-[#05050c] hover:bg-[#00d8e6] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* HUD Split Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        {/* Left: Recent Probes Feed */}
        <div className="stitch-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff5e07]" />
                Recent Orbit Probes ({guesses.length})
              </h3>
              <span className="font-mono text-[10px] text-[#8080a0] uppercase">Proximity Rank</span>
            </div>

            {guesses.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-[#8080a0]/60">
                No probes launched yet. Type any everyday concept to scan proximity.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {[...guesses].reverse().map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#070714] border border-white/5 font-mono text-xs hover:border-white/20 transition-colors"
                  >
                    <span className="font-bold text-[#eef2ff] uppercase tracking-wider">{g.word}</span>
                    <div className="flex items-center gap-3">
                      <span className={\`font-bold \${
                        g.rank === 1 ? 'text-[#00ff88]' : g.rank < 100 ? 'text-[#ff5e07]' : g.rank < 1000 ? 'text-[#ffaa00]' : 'text-[#00f0ff]'
                      }\`}>
                        #{g.rank}
                      </span>
                      <span className="text-[10px] text-[#8080a0]">{Math.round(g.similarityScore * 100)}% Sim</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Decrypted Progressive Hints */}
        <div className="stitch-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Decrypted Hints ({unlockedHints.length}/3)
              </h3>
              <span className="font-mono text-xs text-[#00ff88] font-bold">{currentScore} pts</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((idx) => {
                const hint = unlockedHints[idx];
                const penalty = idx === 0 ? '-100 pts' : idx === 1 ? '-200 pts' : '-350 pts';

                return (
                  <div
                    key={idx}
                    className={\`p-3 rounded-2xl border text-xs font-mono transition-all \${
                      hint
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#eef2ff]'
                        : 'bg-[#070714] border-white/5 text-[#8080a0]'
                    }\`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase font-bold text-[#00f0ff]">Clue #{idx + 1}</span>
                      {!hint && <span className="text-[9px] text-[#ff5e07]">{penalty}</span>}
                    </div>
                    {hint ? (
                      <p className="text-[#eef2ff] leading-relaxed">{hint}</p>
                    ) : (
                      <p className="italic text-[#8080a0]/60">Encrypted transmission signal...</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {!solved && unlockedHints.length < 3 && (
              <button
                onClick={handleHintClick}
                disabled={hintLoading}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#00f0ff] font-mono text-xs font-bold uppercase tracking-wider transition-all border border-[#00f0ff]/30 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Decrypt Next Clue</span>
              </button>
            )}

            {solved && (
              <button
                onClick={onShowRoast}
                className="w-full py-2.5 rounded-xl bg-[#00ff88] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>View Neural AI Roast</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`;

// 2. Update App.tsx
const appFile = path.join(root, 'src/App.tsx');
let appContent = fs.readFileSync(appFile, 'utf8');

appContent = appContent.replace(/setView\('standings'\)/g, "setCurrentView('standings')");

appContent = appContent.replace(
  /<OrbitSolvedModal[\s\S]*?\/>/,
  `<OrbitSolvedModal
        isOpen={isSolvedOpen}
        onClose={() => setIsSolvedOpen(false)}
        onOpenStandings={() => {
          setIsSolvedOpen(false);
          setCurrentView('standings');
        }}
        sessionId={sessionId || ''}
        finalScore={currentScore}
        guessesCount={guesses.length}
        targetWord={guesses.find((g) => g.rank === 1)?.word || 'GALAXY'}
      />`
);

fs.writeFileSync(path.join(root, 'src/components/DailyOrbitDesktop.tsx'), dailyOrbitDesktopCode.trim());
fs.writeFileSync(appFile, appContent);

console.log('✅ Applied DailyOrbitDesktop and App.tsx updates!');

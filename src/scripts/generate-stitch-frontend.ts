import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// DailyOrbitDesktop.tsx with ultra-clean 3-column desktop layout
const dailyOrbitCode = `import { useState, type FC, type FormEvent } from 'react';
import type { SessionSummary } from '../types/game';
import { Send, Loader2, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyOrbitProps {
  session: SessionSummary;
  onGuess: (word: string) => Promise<void>;
  onRequestHint: () => Promise<void>;
  onReset: () => void;
  loadingHint: boolean;
}

export const DailyOrbitDesktop: FC<DailyOrbitProps> = ({
  session,
  onGuess,
  onRequestHint,
  onReset,
  loadingHint,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || submitting) return;
    try {
      setSubmitting(true);
      await onGuess(trimmed);
      setInputVal('');
    } finally {
      setSubmitting(false);
    }
  };

  const guesses = session.guesses || [];
  const bestGuess = guesses.length > 0 ? [...guesses].sort((a, b) => (a.rank || 9999) - (b.rank || 9999))[0] : null;
  const hints = session.revealedHints || session.unlockedHints || [];
  const penalties = [100, 200, 350];
  const nextPenalty = penalties[hints.length] || 350;

  return (
    <div className="w-full max-w-7xl mx-auto pt-20 pb-12 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 items-start">
      
      {/* --- LEFT COLUMN: RECENT ORBITS (3 Cols) --- */}
      <div className="lg:col-span-3 stitch-card rounded-2xl p-4 sm:p-5 border border-white/5 order-2 lg:order-1">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5 mb-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#8080a0] font-bold">
            Recent Orbits
          </h3>
          <span className="font-mono text-[10px] text-[#00f0ff]">
            {guesses.length} total
          </span>
        </div>

        {guesses.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-[#8080a0]">
            No probes launched yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {[...guesses].reverse().map((g, idx) => {
              const isBest = g.rank === bestGuess?.rank;
              return (
                <div
                  key={\`\${g.word}-\${idx}\`}
                  className={\`p-2.5 rounded-xl flex justify-between items-center transition-all \${
                    g.rank === 1
                      ? 'bg-[#00f0ff]/15 border border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : isBest
                      ? 'bg-[#ff5e07]/10 border border-[#ff5e07]/40'
                      : 'bg-[#070714] border border-white/5 hover:border-white/10'
                  }\`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{g.signal?.emoji || '🌌'}</span>
                    <span className="font-sans text-sm font-medium capitalize text-[#eef2ff]">
                      {g.word}
                    </span>
                  </div>

                  <span
                    className={\`font-mono text-xs font-bold \${
                      g.rank === 1
                        ? 'text-[#00f0ff]'
                        : g.rank <= 10
                        ? 'text-[#ff5e07]'
                        : g.rank <= 100
                        ? 'text-[#ff9d00]'
                        : 'text-[#8080a0]'
                    }\`}
                  >
                    #{g.rank} Orbit
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- CENTER COLUMN: HOLOGRAPHIC STAR MAP & RADAR (6 Cols) --- */}
      <div className="lg:col-span-6 flex flex-col items-center text-center order-1 lg:order-2">
        <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-square flex items-center justify-center my-1 select-none">
          <div className="absolute inset-0 rounded-full border border-white/5 shadow-[inset_0_0_40px_rgba(0,240,255,0.03)]"></div>
          <div className="absolute w-[76%] h-[76%] rounded-full border border-white/10"></div>
          <div className="absolute w-[52%] h-[52%] rounded-full border border-white/15"></div>
          <div className="absolute w-[28%] h-[28%] rounded-full border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]"></div>

          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          <div className="w-10 h-10 rounded-full border border-[#00f0ff] bg-[#00f0ff]/20 flex items-center justify-center relative z-20 shadow-[0_0_25px_#00f0ff]">
            <div className="w-3.5 h-3.5 rounded-full bg-[#00f0ff]"></div>
          </div>

          {guesses.slice(-8).map((g, idx) => {
            const radiusFraction = Math.min(0.88, Math.max(0.24, Math.log10(Math.max(1, g.rank || 1)) / 3.6));
            const angle = (idx * 137.5 * Math.PI) / 180;
            const x = 50 + radiusFraction * 44 * Math.cos(angle);
            const y = 50 + radiusFraction * 44 * Math.sin(angle);

            const isCenter = g.rank === 1;
            const color = isCenter ? '#00f0ff' : g.rank <= 10 ? '#ff5e07' : g.rank <= 100 ? '#ff9d00' : '#8080a0';

            return (
              <motion.div
                key={\`orb-\${g.word}-\${idx}\`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ left: \`\${x}%\`, top: \`\${y}%\` }}
                className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
              >
                <div
                  style={{ backgroundColor: color, boxShadow: \`0 0 10px \${color}\` }}
                  className="w-2.5 h-2.5 rounded-full"
                />
                <span
                  style={{ color }}
                  className="font-mono text-[9px] font-bold mt-1 bg-[#05050c]/90 px-1.5 py-0.5 rounded border border-white/10"
                >
                  {g.word}
                </span>
              </motion.div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md mt-2 relative">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="ENTER SEMANTIC PROBE..."
            autoFocus
            autoComplete="off"
            spellCheck="false"
            disabled={submitting}
            className="w-full bg-transparent border-none text-center font-mono text-base sm:text-lg font-bold tracking-widest text-[#00f0ff] placeholder:text-[#8080a0]/40 focus:outline-none py-2"
          />
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_12px_#00f0ff]"></div>

          <button
            type="submit"
            disabled={!inputVal.trim() || submitting}
            className="absolute right-0 top-1 text-[#00f0ff] hover:text-white p-2 disabled:opacity-30 transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* --- RIGHT COLUMN: ORBITAL STATUS & CLUES (3 Cols) --- */}
      <div className="lg:col-span-3 stitch-card rounded-2xl p-4 sm:p-5 border border-white/5 order-3 flex flex-col gap-3">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#8080a0] font-bold">
            Orbital Status
          </h3>
          <button
            onClick={onReset}
            className="text-[10px] font-mono text-[#8080a0] hover:text-[#00f0ff] flex items-center gap-1"
            title="Reset board"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex justify-between items-center py-0.5">
          <span className="font-mono text-xs text-[#8080a0]">Current Streak</span>
          <span className="font-mono text-sm font-bold text-[#00f0ff]">12</span>
        </div>

        <div className="flex justify-between items-center py-0.5">
          <span className="font-mono text-xs text-[#8080a0]">Global Rank</span>
          <span className="font-mono text-sm font-bold text-[#eef2ff]">#4,182</span>
        </div>

        <div className="my-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#00f0ff]/30 border-t-[#00f0ff] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <span className="font-mono text-[8px] text-[#8080a0] uppercase">Accuracy</span>
            <span className="font-mono text-sm font-bold text-[#00f0ff]">
              {guesses.length > 0 ? \`\${Math.round(Math.max(10, 100 - (bestGuess?.rank || 100) / 10))}%\` : '78%'}
            </span>
          </div>
        </div>

        {/* Revealed Hints Box */}
        {hints.length > 0 && (
          <div className="flex flex-col gap-2 my-1">
            <AnimatePresence>
              {hints.map((hint, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-[#0c0c1f] border border-[#00f0ff]/30 shadow-md text-xs font-sans text-[#eef2ff]"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#00f0ff] font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      CLUE #{idx + 1}
                    </span>
                    <span className="text-[#ff9d00] font-mono text-[9px]">
                      -{penalties[idx]} pts
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px]">{hint}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Request Hint Button */}
        {hints.length < 3 ? (
          <button
            onClick={onRequestHint}
            disabled={loadingHint}
            className="w-full py-2.5 px-3 rounded-xl border border-[#ff9d00]/40 bg-[#ff9d00]/10 text-[#ff9d00] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#ff9d00] hover:text-[#05050c] hover:shadow-[0_0_20px_rgba(255,157,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-auto disabled:opacity-50"
          >
            {loadingHint ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Decrypting...</span>
              </>
            ) : (
              <>
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Request Clue #{hints.length + 1} (-{nextPenalty} pts)</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-center font-mono text-[10px] text-[#8080a0] py-1 border-t border-white/5 mt-auto">
            ✓ All 3 Orbital Clues Decrypted
          </div>
        )}
      </div>

    </div>
  );
};
`;

fs.writeFileSync(path.join(root, 'src/components/DailyOrbitDesktop.tsx'), dailyOrbitCode.trim());
console.log('✅ DailyOrbitDesktop responsive layout optimized!');

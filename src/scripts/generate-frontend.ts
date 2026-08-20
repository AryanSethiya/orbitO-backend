import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// 1. components/Header.tsx
const headerCode = `import type { FC } from 'react';
import { HelpCircle, Trophy, Orbit } from 'lucide-react';

interface HeaderProps {
  date: string;
  difficulty: string;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
}

export const Header: FC<HeaderProps> = ({
  difficulty,
  onOpenLeaderboard,
  onOpenHelp,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-40 px-4 md:px-8 py-3.5">
      <div className="max-w-4xl mx-auto cyber-glass rounded-2xl px-5 py-2.5 flex justify-between items-center shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#7213ff]/30 border border-[#00f0ff]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Orbit className="w-5 h-5 text-[#00f0ff] animate-spin" style={{ animationDuration: '25s' }} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display-lg text-lg md:text-xl font-bold tracking-tight text-[#dbfcff] glow-cyan">
                ORBITO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-label-mono font-bold uppercase tracking-wider bg-[#ff5e07]/15 border border-[#ff5e07]/40 text-[#ffb59a]">
                {difficulty || 'DAILY'}
              </span>
            </div>
            <span className="text-[10px] font-label-mono text-[#849495] tracking-wider uppercase hidden sm:block">
              Semantic Distance Radar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-[#b9cacb] hover:text-[#00f0ff] hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs font-label-mono"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-[#00f0ff]" />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-label-mono font-semibold"
            title="Space Standings"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Standings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
`;

// 2. components/SolveModal.tsx
const solveModalCode = `import { useState, type FC } from 'react';
import type { ScoreBreakdown, AIRoast } from '../types/game';
import { Share2, Sparkles, Trophy, Check, Terminal, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface SolveModalProps {
  guessesCount: number;
  scoreBreakdown?: ScoreBreakdown | null;
  roast: AIRoast | null;
  onGenerateRoast: (style: 'friendly' | 'savage' | 'hype' | 'balanced') => Promise<void>;
  loadingRoast: boolean;
  onOpenLeaderboard: () => void;
  onResetGame: () => void;
}

export const SolveModal: FC<SolveModalProps> = ({
  guessesCount,
  scoreBreakdown,
  roast,
  onGenerateRoast,
  loadingRoast,
  onOpenLeaderboard,
  onResetGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'friendly' | 'savage' | 'hype' | 'balanced'>('savage');

  const finalScore = scoreBreakdown?.finalScore ?? 890;

  const handleShare = () => {
    const text = \`🌌 ORBITO #\${new Date().toLocaleDateString()} 🎯\\n\` +
      \`Solved in \${guessesCount} guesses!\\n\` +
      \`Score: \${finalScore} pts\\n\` +
      \`https://orbito.game\`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="cyber-glass box-glow-supernova rounded-3xl w-full max-w-lg p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-[#ff5e07]/40 my-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff5e07]/30 to-[#00f0ff]/20 border-2 border-[#00f0ff] shadow-[0_0_35px_rgba(0,240,255,0.8)] flex items-center justify-center mb-3">
          <Sparkles className="w-8 h-8 text-[#00f0ff]" />
        </div>

        <h2 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-[#dbfcff] glow-cyan tracking-tight mb-1">
          ORBIT SOLVED!
        </h2>
        <p className="font-headline-md text-sm sm:text-base text-[#b9cacb] mb-6">
          You reached the Center in <span className="text-[#00f0ff] font-bold">{guessesCount}</span> guesses
        </p>

        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          <div className="cyber-glass p-3 rounded-2xl flex flex-col items-center">
            <span className="font-label-mono text-[9px] text-[#849495] uppercase tracking-wider">Final Score</span>
            <span className="font-semantic-word text-xl font-bold text-[#00f0ff]">{finalScore}</span>
          </div>
          <div className="cyber-glass p-3 rounded-2xl flex flex-col items-center">
            <span className="font-label-mono text-[9px] text-[#849495] uppercase tracking-wider">Guesses</span>
            <span className="font-semantic-word text-xl font-bold text-[#ffb59a]">{guessesCount}</span>
          </div>
          <div className="cyber-glass p-3 rounded-2xl flex flex-col items-center">
            <span className="font-label-mono text-[9px] text-[#849495] uppercase tracking-wider">Clues Used</span>
            <span className="font-semantic-word text-xl font-bold text-[#ffdcc3]">{scoreBreakdown?.hintsUsed ?? 0}</span>
          </div>
        </div>

        <div className="terminal-screen w-full rounded-2xl p-4 sm:p-5 mb-6 text-left shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#3b494b] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
              <span className="font-label-mono text-[11px] text-[#00f0ff] font-bold uppercase tracking-wider">
                Gemini 3.5 Flash // Neural Roast
              </span>
            </div>
            <div className="flex gap-1">
              {(['savage', 'friendly', 'hype'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedStyle(style);
                    onGenerateRoast(style);
                  }}
                  disabled={loadingRoast}
                  className={\`px-2.5 py-0.5 text-[9px] font-label-mono font-bold rounded-md capitalize transition-all \${
                    selectedStyle === style
                      ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_10px_#00f0ff]'
                      : 'text-[#849495] hover:text-white bg-white/5'
                  }\`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[75px] flex items-center">
            {loadingRoast ? (
              <p className="font-label-mono text-xs text-[#00f0ff] animate-pulse">
                &gt; Synthesizing cognitive association trajectory and roasting player...
              </p>
            ) : roast ? (
              <p className="font-label-mono text-xs text-[#e2e0fb] leading-relaxed">
                "{roast.roastText}"
              </p>
            ) : (
              <p className="font-label-mono text-xs text-[#849495]">
                &gt; Click a roast style to trigger AI commentary.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-full border border-[#00f0ff] text-[#00f0ff] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00f0ff]/15 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied Results!' : 'Share Orbit'}</span>
          </button>
          
          <button
            onClick={onOpenLeaderboard}
            className="py-3 px-6 rounded-full bg-[#00f0ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Standings</span>
          </button>
        </div>

        <button
          onClick={onResetGame}
          className="mt-4 text-[11px] font-label-mono text-[#849495] hover:text-[#00f0ff] flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Play again with a fresh board</span>
        </button>
      </motion.div>
    </div>
  );
};
`;

fs.writeFileSync(path.join(root, 'src/components/Header.tsx'), headerCode.trim());
fs.writeFileSync(path.join(root, 'src/components/SolveModal.tsx'), solveModalCode.trim());
console.log('Cleaned unused imports!');

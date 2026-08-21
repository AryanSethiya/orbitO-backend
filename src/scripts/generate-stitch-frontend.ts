import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// 1. OrbitSolvedModal.tsx - Pure Savage Mode Only
const orbitSolvedModalCode = `import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import { Trophy, Share2, Clock, Check, Terminal, Flame, X } from 'lucide-react';

interface OrbitSolvedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStandings: () => void;
  sessionId: string;
  finalScore: number;
  guessesCount: number;
  targetWord?: string;
}

export const OrbitSolvedModal: FC<OrbitSolvedModalProps> = ({
  isOpen,
  onClose,
  onOpenStandings,
  sessionId,
  finalScore,
  guessesCount,
  targetWord = 'TODAY TARGET',
}) => {
  const [streamedRoast, setStreamedRoast] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mins = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setCountdown(\`\${hours}:\${mins}:\${secs}\`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSavageRoast();
    }
  }, [isOpen, sessionId]);

  const fetchSavageRoast = async () => {
    try {
      const res = await ApiClient.generateRoast(sessionId, 'savage');
      streamText(res.roastText);
    } catch {
      const fallback = \`Took you \${guessesCount} chaotic probes just to stumble into "\${targetWord}"? Even an offline satellite navigates faster than that.\`;
      streamText(fallback);
    }
  };

  const streamText = (fullText: string) => {
    setIsStreaming(true);
    setStreamedRoast('');
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < fullText.length) {
        setStreamedRoast(fullText.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(timer);
        setIsStreaming(false);
      }
    }, 20);
  };

  if (!isOpen) return null;

  const handleShare = () => {
    const text = \`🛰️ Orbito // Orbit Solved!\n🎯 Score: \${finalScore} pts | \${guessesCount} Probes\n🔥 Savage Roast: "\${streamedRoast}"\n🪐 Play today: https://orbito-backend-zacg.onrender.com\`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg stitch-card rounded-3xl p-6 sm:p-8 border border-[#ff5e07]/40 relative shadow-[0_0_50px_rgba(255,94,7,0.2)] text-center">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8080a0] hover:text-[#eef2ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <img 
          src="/logo.png" 
          alt="oRBITO Logo" 
          className="h-12 w-auto mx-auto mb-3 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]"
          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
        />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 font-mono text-xs text-[#00ff88] font-bold uppercase tracking-widest mb-3">
          <Trophy className="w-3.5 h-3.5" />
          Orbit Solved
        </div>

        <h2 className="font-mono text-xl sm:text-2xl font-black text-[#eef2ff] uppercase tracking-wider">
          Center Target Acquired!
        </h2>
        <p className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest mt-1 font-bold">
          Target: {targetWord}
        </p>

        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-[#070714] border border-white/10">
            <span className="font-mono text-[10px] text-[#8080a0] uppercase block">Final Score</span>
            <span className="font-mono text-2xl font-black text-[#00ff88]">{finalScore}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070714] border border-white/10">
            <span className="font-mono text-[10px] text-[#8080a0] uppercase block">Total Probes</span>
            <span className="font-mono text-2xl font-black text-[#00f0ff]">{guessesCount}</span>
          </div>
        </div>

        {/* Live Streaming Savage AI Roast Terminal */}
        <div className="text-left rounded-2xl bg-[#070714] border border-[#ff5e07]/30 p-4 mb-5 shadow-inner">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/5">
            <span className="font-mono text-[10px] text-[#ff5e07] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Savage Neural Roast // Gemini 3.5
            </span>
            <span className="font-mono text-[9px] text-[#8080a0] uppercase font-bold">
              [Savage Mode]
            </span>
          </div>

          <p className="font-mono text-xs text-[#eef2ff] leading-relaxed min-h-[55px]">
            {streamedRoast}
            {isStreaming && <span className="inline-block w-2 h-3.5 bg-[#ff5e07] ml-1 animate-pulse" />}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-[#8080a0] mb-5">
          <Clock className="w-4 h-4 text-[#00f0ff]" />
          <span>Next Daily Orbit in:</span>
          <span className="font-bold text-[#eef2ff]">{countdown}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#eef2ff] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Share Roast'}</span>
          </button>

          <button
            onClick={onOpenStandings}
            className="py-3 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Standings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
`;

// 2. App.tsx with robust hint handling
const appFile = path.join(root, 'src/App.tsx');
let appContent = fs.readFileSync(appFile, 'utf8');

const newHandleHint = `  const handleRequestHint = async () => {
    if (!sessionId) return;
    try {
      const res: any = await ApiClient.requestHint(sessionId);
      if (res.revealedHints && Array.isArray(res.revealedHints)) {
        setUnlockedHints(res.revealedHints);
      } else if (res.hintText) {
        setUnlockedHints((prev) => (prev.includes(res.hintText) ? prev : [...prev, res.hintText]));
      } else if (res.session?.revealedHints) {
        setUnlockedHints(res.session.revealedHints);
      }

      if (res.session?.score !== undefined) {
        setCurrentScore(res.session.score);
      } else if (res.penaltyCost) {
        setCurrentScore((prev) => Math.max(0, prev - res.penaltyCost));
      }
    } catch (err: any) {
      console.warn('Hint request note:', err?.message || err);
    }
  };`;

appContent = appContent.replace(/const handleRequestHint = async[\s\S]*?console\.warn\('Hint error:[\s\S]*?\};/, newHandleHint.trim());
if (!appContent.includes('const handleRequestHint = async')) {
  appContent = appContent.replace(/const handleRequestHint = async[\s\S]*?console\.warn\('Hint request note:[\s\S]*?\};/, newHandleHint.trim());
}

fs.writeFileSync(appFile, appContent);
fs.writeFileSync(path.join(root, 'src/components/OrbitSolvedModal.tsx'), orbitSolvedModalCode.trim());

console.log('✅ Updated OrbitSolvedModal with pure Savage Mode and fixed Hint decryption in App.tsx!');

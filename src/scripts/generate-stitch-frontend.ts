import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// 1. LandingAuthView.tsx
const landingAuthCode = `import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { Shield, Sparkles, Compass, Flame, ArrowRight, AlertCircle, Radio } from 'lucide-react';

interface LandingAuthViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const LandingAuthView: FC<LandingAuthViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('aryansethiya111@gmail.com');
  const [pilotName, setPilotName] = useState('Aryan Sethiya');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google Sign-In did not return a valid credential.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = parseJwt(credentialResponse.credential);
      const userEmail = payload?.email || email;
      const userName = payload?.name || payload?.given_name || pilotName;
      const picture = payload?.picture || \`https://api.dicebear.com/7.x/bottts/svg?seed=\${encodeURIComponent(userName)}\`;
      const googleId = payload?.sub;

      const res = await ApiClient.loginWithGoogle({
        credential: credentialResponse.credential,
        email: userEmail,
        name: userName,
        picture,
        googleId,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your Google email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const name = pilotName.trim() || email.split('@')[0];
      const picture = \`https://api.dicebear.com/7.x/bottts/svg?seed=\${encodeURIComponent(name)}\`;

      const res = await ApiClient.loginWithGoogle({
        email: email.trim().toLowerCase(),
        name,
        picture,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 pt-12 pb-16 relative z-10">
      {/* Hero Branding */}
      <div className="text-center max-w-xl mx-auto mb-8 flex flex-col items-center">
        <div className="relative mb-4">
          <img
            src="/logo.png"
            alt="oRBITO Logo"
            className="h-20 sm:h-24 w-auto filter drop-shadow-[0_0_25px_rgba(0,240,255,0.7)] hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-2 right-0 px-2 py-0.5 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            Live Daily Orbit
          </div>
        </div>

        <h1 className="font-mono text-3xl sm:text-5xl font-black text-[#eef2ff] uppercase tracking-wider">
          oRBITO
        </h1>
        <p className="font-mono text-xs sm:text-sm text-[#00f0ff] uppercase tracking-widest mt-2 font-bold max-w-md">
          Semantic Word Orbit // Daily AI Proximity Puzzle
        </p>
      </div>

      {/* Main Authentication Launchpad Card */}
      <div className="w-full max-w-md stitch-card rounded-3xl p-6 sm:p-8 border border-white/15 relative shadow-[0_0_60px_rgba(0,240,255,0.12)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div className="text-left">
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Authentication</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Sign In to Launch Today's Orbit</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Official Google OAuth Button */}
        <div className="w-full flex flex-col items-center justify-center mb-5 bg-[#0c0c1f] p-4 rounded-2xl border border-[#00f0ff]/20 shadow-inner">
          <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-3 font-bold tracking-wider">
            Sign In with Google Account
          </label>
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In was cancelled or failed.')}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
              width="100%"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="font-mono text-[10px] text-[#8080a0] uppercase">Or Quick Launch Callsign</span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* 2. Direct Pilot Form */}
        <form onSubmit={handleDirectLogin} className="flex flex-col gap-3 text-left">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1 font-semibold">Google Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
                className="w-full bg-[#070714] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-mono text-[#eef2ff] placeholder:text-[#8080a0]/30 focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1 font-semibold">Pilot Callsign</label>
              <input
                type="text"
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="Aryan Sethiya"
                className="w-full bg-[#070714] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-mono text-[#eef2ff] placeholder:text-[#8080a0]/30 focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            id="landing-launch-btn"
            disabled={loading}
            className="w-full mt-1 py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Initializing Orbit...' : \`Launch as \${pilotName || 'Pilot'}\`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 3 Visual Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-8 text-left">
        <div className="p-4 rounded-2xl bg-[#070714]/80 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#00f0ff]">
            <Compass className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase">1. Daily Orbit</span>
          </div>
          <p className="font-mono text-[11px] text-[#8080a0] leading-relaxed">
            One secret target concept every 24 hours across life, arts, science, and nature.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070714]/80 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#ffaa00]">
            <Sparkles className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase">2. 3D Radar</span>
          </div>
          <p className="font-mono text-[11px] text-[#8080a0] leading-relaxed">
            Launch words as probes. Gemini vectors map your conceptual proximity in 3D orbit.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070714]/80 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#ff5e07]">
            <Flame className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase">3. Savage Roast</span>
          </div>
          <p className="font-mono text-[11px] text-[#8080a0] leading-relaxed">
            Hit Rank #1 and receive an unfiltered AI roast streaming your exact guess trajectory.
          </p>
        </div>
      </div>
    </div>
  );
};
`;

// 2. Updated App.tsx routing !user -> LandingAuthView
const appCode = `import { useState, useEffect } from 'react';
import { ApiClient } from './api/client';
import type { Guess, UserProfile } from './types/game';
import { Navbar } from './components/Navbar';
import { LandingAuthView } from './components/LandingAuthView';
import { DailyOrbitDesktop } from './components/DailyOrbitDesktop';
import { OrbitSolvedModal } from './components/OrbitSolvedModal';
import { SpaceStandingsView } from './components/SpaceStandingsView';
import { AuthModal } from './components/AuthModal';
import { CommunityModal } from './components/CommunityModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'mission' | 'game' | 'leaderboard'>('game');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(1000);
  const [solved, setSolved] = useState<boolean>(false);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [loadingGuess, setLoadingGuess] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  const [isSolvedOpen, setIsSolvedOpen] = useState<boolean>(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

  useEffect(() => {
    // Restore User Profile if previously logged in
    const cachedUser = localStorage.getItem('orbito_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setUser(u);
        initSession(u.id);
      } catch {
        // Unauthenticated -> Landing View
      }
    }
  }, []);

  const initSession = async (userId?: string) => {
    try {
      const res = await ApiClient.startSession(userId);
      setSessionId(res.sessionId);
      if (res.solved) {
        setSolved(true);
      }
      if (res.score !== undefined) {
        setCurrentScore(res.score);
      }
      if (res.guesses) {
        setGuesses(res.guesses.map((g: any) => ({
          id: g.id,
          word: g.word?.word || g.word,
          rank: g.rank || 500,
          similarityScore: g.semanticScore !== undefined ? g.semanticScore : (g.similarityScore !== undefined ? g.similarityScore : (g.rank === 1 ? 1.0 : 0.5)),
          scoreDelta: g.scoreDelta || -5,
          createdAt: g.createdAt,
        })));
      }
      if (res.revealedHints) {
        setUnlockedHints(res.revealedHints);
      }
    } catch (err) {
      console.error('Session init error:', err);
    }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    initSession(newUser.id);
    setCurrentView('game');
  };

  const handleLogout = () => {
    localStorage.removeItem('orbito_auth_token');
    localStorage.removeItem('orbito_user');
    localStorage.removeItem('orbito_player_id');
    setUser(null);
    setActiveRoomCode(null);
    setGuesses([]);
    setSolved(false);
    setUnlockedHints([]);
  };

  const handleSubmitGuess = async (word: string) => {
    if (!sessionId) return;
    try {
      setLoadingGuess(true);
      const res: any = await ApiClient.submitGuess(sessionId, word);
      
      const newGuess: Guess = {
        word: res.word || word,
        rank: res.rank || 500,
        similarityScore: res.semanticScore !== undefined ? res.semanticScore : (res.similarityScore || 0.5),
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };

      setGuesses((prev) => [...prev, newGuess]);
      if (res.scoreBreakdown?.finalScore !== undefined) {
        setCurrentScore(res.scoreBreakdown.finalScore);
      } else {
        setCurrentScore((prev) => Math.max(0, prev - 5));
      }

      if (res.isSolved || res.rank === 1) {
        setSolved(true);
        setIsSolvedOpen(true);
      }
    } catch (err: any) {
      console.warn('Guess error:', err.message);
    } finally {
      setLoadingGuess(false);
    }
  };

  const handleRequestHint = async () => {
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
  };

  const handleRoomJoined = (room: { id: string; code: string; name: string }) => {
    setActiveRoomCode(room.code);
    if (user) {
      const updatedUser = { ...user, community: room.name };
      setUser(updatedUser);
      localStorage.setItem('orbito_user', JSON.stringify(updatedUser));
    }
  };

  // If user is not authenticated, show Landing Sign-In Page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#05050c] text-[#eef2ff] font-sans relative overflow-x-hidden selection:bg-[#00f0ff] selection:text-[#05050c]">
        {/* Dynamic Starfield Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#ff5e07]/5 rounded-full blur-3xl" />
        </div>

        <LandingAuthView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050c] text-[#eef2ff] font-sans relative overflow-x-hidden selection:bg-[#00f0ff] selection:text-[#05050c]">
      {/* Dynamic Starfield Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#ff5e07]/5 rounded-full blur-3xl" />
      </div>

      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        onLogout={handleLogout}
        activeRoomCode={activeRoomCode}
      />

      <main className="relative z-10">
        {currentView === 'game' && (
          <DailyOrbitDesktop
            guesses={guesses}
            currentScore={currentScore}
            solved={solved}
            unlockedHints={unlockedHints}
            onSubmitGuess={handleSubmitGuess}
            onRequestHint={handleRequestHint}
            onShowRoast={() => setIsSolvedOpen(true)}
            onOpenStandings={() => setCurrentView('leaderboard')}
            user={user}
            loadingGuess={loadingGuess}
          />
        )}

        {currentView === 'leaderboard' && (
          <SpaceStandingsView
            user={user}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            activeRoomCode={activeRoomCode}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        user={user}
        onRoomJoined={handleRoomJoined}
        onRequireAuth={() => {
          setIsCommunityOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <OrbitSolvedModal
        isOpen={isSolvedOpen}
        onClose={() => setIsSolvedOpen(false)}
        onOpenStandings={() => {
          setIsSolvedOpen(false);
          setCurrentView('leaderboard');
        }}
        sessionId={sessionId || ''}
        finalScore={currentScore}
        guessesCount={guesses.length}
        targetWord={guesses.find((g) => g.rank === 1)?.word || 'GALAXY'}
      />
    </div>
  );
}
`;

fs.writeFileSync(path.join(root, 'src/components/LandingAuthView.tsx'), landingAuthCode.trim());
fs.writeFileSync(path.join(root, 'src/App.tsx'), appCode.trim());

console.log('✅ Created LandingAuthView and updated App.tsx landing flow!');

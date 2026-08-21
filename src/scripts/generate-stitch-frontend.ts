import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// 1. types/game.ts
const typesCode = `export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string;
  community: string;
}

export interface SemanticSignal {
  tier: 'CENTER' | 'BURNING' | 'VERY_HOT' | 'HOT' | 'WARM' | 'LUKEWARM' | 'COOL' | 'COLD' | 'DEEP_SPACE';
  emoji: string;
  label: string;
  color?: string;
  rank?: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  guessesPenalty: number;
  hintsPenalty: number;
  timeBonus: number;
  finalScore: number;
  hintsUsed?: number;
}

export interface GuessResult {
  id?: string;
  word: string;
  normalizedWord: string;
  rank: number;
  semanticScore: number;
  signal: SemanticSignal;
  guessesCount?: number;
  isSolved?: boolean;
  scoreBreakdown?: ScoreBreakdown;
  createdAt?: string;
}

export interface SessionSummary {
  sessionId: string;
  puzzleDate: string;
  puzzleDifficulty: string;
  solved: boolean;
  score: number;
  guessesCount: number;
  hintsUsed: number;
  revealedHints: string[];
  bestRank: number | null;
  startedAt?: string | Date;
  completedAt?: string | Date | null;
  guesses: GuessResult[];
  date?: string;
  difficulty?: string;
  status?: string;
  unlockedHints?: string[];
}

export interface HintResult {
  hintNumber: number;
  hintText: string;
  hintsUsed: number;
  remainingHints: number;
  penaltyCost: number;
}

export interface AIRoast {
  roastText: string;
  style: 'friendly' | 'savage' | 'hype' | 'balanced';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  community: string;
  score: number;
  guessesCount: number;
  hintsUsed: number;
  completedAt?: string;
}

export interface LeaderboardResponse {
  date: string;
  community?: string;
  totalEntries: number;
  leaderboard: LeaderboardEntry[];
}
`;

// 2. api/client.ts
const apiClientCode = `import type { SessionSummary, GuessResult, HintResult, AIRoast, LeaderboardResponse, UserProfile } from '../types/game';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
const BASE_URL = RAW_URL.replace(/\\/api\\/v1\\/?$/, '').replace(/\\/$/, '');

export class ApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('orbito_auth_token');
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cleanPath = endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`;
    const targetUrl = \`\${BASE_URL}/api/v1\${cleanPath}\`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = \`Bearer \${token}\`;
    }

    const res = await fetch(targetUrl, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'HTTP Error ' + res.status;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  static async loginWithGoogle(credentialOrData: { credential?: string; email?: string; name?: string; picture?: string; community?: string }): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(credentialOrData),
    });
  }

  static async devLogin(callsign: string, community = 'Global Explorers', avatarUrl?: string): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ callsign, community, avatarUrl }),
    });
  }

  static async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  static async updateCommunity(userId: string, community: string): Promise<{ success: boolean; community: string }> {
    return this.request<{ success: boolean; community: string }>('/auth/community', {
      method: 'PATCH',
      body: JSON.stringify({ userId, community }),
    });
  }

  static async startSession(userId?: string): Promise<SessionSummary> {
    const payload = userId ? { userId } : {};
    return this.request<SessionSummary>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async submitGuess(sessionId: string, guess: string): Promise<GuessResult> {
    return this.request<GuessResult>(\`/sessions/\${sessionId}/guess\`, {
      method: 'POST',
      body: JSON.stringify({ guess: guess.trim().toLowerCase() }),
    });
  }

  static async requestHint(sessionId: string): Promise<HintResult> {
    return this.request<HintResult>(\`/sessions/\${sessionId}/hints\`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  static async generateRoast(sessionId: string, style: 'friendly' | 'savage' | 'hype' | 'balanced' = 'savage'): Promise<AIRoast> {
    return this.request<AIRoast>(\`/sessions/\${sessionId}/roast\`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    });
  }

  static async getDailyLeaderboard(community?: string): Promise<LeaderboardResponse> {
    const query = community && community !== 'Global' && community !== 'All' 
      ? \`?community=\${encodeURIComponent(community)}\` 
      : '';
    return this.request<LeaderboardResponse>(\`/leaderboards/daily\${query}\`);
  }

  static async getCommunities(): Promise<{ communities: string[] }> {
    return this.request<{ communities: string[] }>('/leaderboards/communities');
  }
}
`;

// 3. Navbar.tsx with User Profile Avatar & Login Trigger
const navbarCode = `import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { LogOut, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'play' | 'standings' | 'archive' | 'profile';
  onSelectTab: (tab: 'play' | 'standings' | 'archive' | 'profile') => void;
  onGoHome: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onGoHome,
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-[#05050c]/80 backdrop-blur-md z-50 flex items-center justify-between px-4 md:px-8">
      {/* Brand Logo */}
      <div
        onClick={onGoHome}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-full border border-[#00f0ff] flex items-center justify-center relative shadow-[0_0_12px_#00f0ff]">
          <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></div>
        </div>
        <span className="font-mono text-base font-bold tracking-widest text-[#eef2ff] group-hover:text-[#00f0ff] transition-colors">
          ORBITO
        </span>
      </div>

      {/* Center Nav Tabs */}
      <nav className="flex items-center gap-6 sm:gap-8">
        <button
          onClick={() => onSelectTab('play')}
          className={\`relative font-mono text-xs uppercase tracking-wider py-1 transition-colors \${
            activeTab === 'play' ? 'text-[#00f0ff]' : 'text-[#8080a0] hover:text-[#eef2ff]'
          }\`}
        >
          <span>Play</span>
          {activeTab === 'play' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('standings')}
          className={\`relative font-mono text-xs uppercase tracking-wider py-1 transition-colors \${
            activeTab === 'standings' ? 'text-[#00f0ff]' : 'text-[#8080a0] hover:text-[#eef2ff]'
          }\`}
        >
          <span>Standings</span>
          {activeTab === 'standings' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
          )}
        </button>
      </nav>

      {/* User Profile / Google Auth Chip */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 bg-[#0c0c1f] border border-white/10 rounded-full py-1 px-3">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-full border border-[#00f0ff]"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-mono text-[11px] font-bold text-[#eef2ff] leading-none">
                {user.name}
              </span>
              <span className="font-mono text-[9px] text-[#00f0ff] leading-none mt-0.5">
                {user.community}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="text-[#8080a0] hover:text-[#ff5e07] ml-1 p-1 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-[#0c0c1f] border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs font-bold hover:bg-[#00f0ff] hover:text-[#05050c] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
`;

// 4. MissionControlLanding.tsx with Callsign & Community selection
const missionLandingCode = `import { useState, type FC } from 'react';
import type { UserProfile } from '../types/game';
import { Play, MessageSquare, Shield, Users } from 'lucide-react';

interface MissionControlLandingProps {
  onLaunch: () => void;
  onOpenComms: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const MissionControlLanding: FC<MissionControlLandingProps> = ({
  onLaunch,
  onOpenComms,
  user,
  onOpenAuth,
}) => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 w-full">
      <div className="w-full max-w-md stitch-card rounded-3xl p-8 sm:p-10 border border-white/10 flex flex-col items-center text-center shadow-2xl relative">
        
        {/* Glow Pulse Rings */}
        <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center relative my-4">
          <div className="absolute inset-0 rounded-full border border-[#00f0ff]/20 animate-ping"></div>
          <div className="w-16 h-16 rounded-full border border-[#00f0ff]/40 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-[#00f0ff] shadow-[0_0_20px_#00f0ff]"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#eef2ff] mt-2 mb-2">
          Orbito
        </h1>

        {/* Tagline */}
        <p className="font-sans text-sm text-[#8080a0] mb-6 max-w-xs leading-relaxed">
          The semantic word game that orbits the center.
        </p>

        {/* Authenticated Pilot Badge or Sign-In Prompt */}
        {user ? (
          <div className="w-full bg-[#070714] border border-white/5 rounded-2xl p-3.5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full border border-[#00f0ff]" />
              <div className="text-left">
                <span className="font-mono text-xs font-bold text-[#eef2ff] block">{user.name}</span>
                <span className="font-mono text-[10px] text-[#00f0ff] flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {user.community}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
              Ready
            </span>
          </div>
        ) : (
          <div
            onClick={onOpenAuth}
            className="w-full bg-[#070714] border border-[#00f0ff]/30 hover:border-[#00f0ff] rounded-2xl p-3.5 mb-6 flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#00f0ff]" />
              <div className="text-left">
                <span className="font-mono text-xs font-bold text-[#eef2ff] block group-hover:text-[#00f0ff]">
                  Google Pilot Authentication
                </span>
                <span className="font-mono text-[10px] text-[#8080a0]">
                  Link profile to record daily standing
                </span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#00f0ff] font-bold">Sign In &gt;</span>
          </div>
        )}

        {/* Action Dual Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onLaunch}
            className="py-3.5 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch</span>
          </button>

          <button
            onClick={onOpenComms}
            className="py-3.5 px-4 rounded-xl bg-transparent border border-white/10 text-[#8080a0] font-mono text-xs font-bold uppercase tracking-wider hover:border-white/30 hover:text-[#eef2ff] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comms</span>
          </button>
        </div>

        {/* System Online Badge */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#00f0ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping"></span>
          <span>• CORE SYSTEMS ONLINE</span>
        </div>
      </div>
    </main>
  );
};
`;

// 5. SpaceStandingsView.tsx with Dynamic Global & Community tabs
const spaceStandingsCode = `import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { LeaderboardEntry } from '../types/game';
import { Users, Globe, Trophy, Loader2 } from 'lucide-react';

export const SpaceStandingsView: FC = () => {
  const [activeCommunity, setActiveCommunity] = useState<string>('Global');
  const [communities, setCommunities] = useState<string[]>(['Global', 'Starfleet Academy', 'Nebula Squad', 'Cosmic Voyagers', 'Astrophysicists']);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandings = async (communityName: string) => {
    try {
      setLoading(true);
      const res = await ApiClient.getDailyLeaderboard(communityName);
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      console.error('Failed to load standings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ApiClient.getCommunities().then((res) => {
      if (res.communities && res.communities.length > 0) {
        setCommunities(['Global', ...res.communities.filter((c) => c !== 'Global')]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchStandings(activeCommunity);
  }, [activeCommunity]);

  return (
    <div className="w-full max-w-4xl mx-auto pt-24 pb-16 px-4 md:px-8 relative z-10 flex flex-col items-center">
      
      {/* Title */}
      <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#eef2ff] text-center mb-1">
        Space Standings
      </h1>
      <p className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest text-center mb-6">
        REAL-TIME LEADERBOARDS // TODAY'S ORBIT
      </p>

      {/* Community / Fleet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 mb-6 scrollbar-none">
        {communities.map((comm) => (
          <button
            key={comm}
            onClick={() => setActiveCommunity(comm)}
            className={\`py-1.5 px-4 rounded-full font-mono text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 \${
              activeCommunity === comm
                ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#0c0c1f] text-[#8080a0] border border-white/5 hover:border-white/20 hover:text-[#eef2ff]'
            }\`}
          >
            {comm === 'Global' ? <Globe className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>{comm}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard Table Card */}
      <div className="w-full stitch-card rounded-2xl p-6 border border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#00f0ff] animate-spin" />
            <span className="font-mono text-xs text-[#00f0ff] tracking-widest">
              QUERYING ORBITAL TELEMETRY...
            </span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-[#8080a0]/40" />
            <p className="font-mono text-sm text-[#8080a0]">No completed orbits recorded in {activeCommunity} yet today.</p>
            <p className="font-mono text-xs text-[#00f0ff]">Be the first pilot to solve today's puzzle and claim Rank #1!</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-[#8080a0] uppercase border-b border-white/5 tracking-wider pb-3">
                  <th className="pb-3 px-3 font-semibold">Rank</th>
                  <th className="pb-3 px-3 font-semibold">Pilot</th>
                  <th className="pb-3 px-3 font-semibold">Community</th>
                  <th className="pb-3 px-3 font-semibold text-center">Probes</th>
                  <th className="pb-3 px-3 font-semibold text-right">Holding Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.userId + '-' + entry.rank}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-3 font-bold text-sm">
                        {isTop1 ? '🥇 #1' : isTop2 ? '🥈 #2' : isTop3 ? '🥉 #3' : \`#\${entry.rank}\`}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={entry.avatarUrl || \`https://api.dicebear.com/7.x/bottts/svg?seed=\${encodeURIComponent(entry.username)}\`}
                            alt={entry.username}
                            className="w-7 h-7 rounded-full border border-white/10"
                          />
                          <span className="font-sans text-sm font-semibold text-[#eef2ff]">
                            {entry.name || entry.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-[#8080a0]">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px]">
                          {entry.community}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center text-[#8080a0]">
                        {entry.guessesCount}
                      </td>
                      <td className="py-4 px-3 text-right font-bold text-[#00f0ff] text-sm">
                        {entry.score.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
`;

// 6. AuthModal.tsx for Google Sign-In and Pilot Callsign Selection
const authModalCode = `import { useState, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [callsign, setCallsign] = useState('');
  const [community, setCommunity] = useState('Starfleet Academy');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDevPilotLogin = async (pilotName: string, fleet: string) => {
    try {
      setLoading(true);
      const res = await ApiClient.devLogin(pilotName, fleet);
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSimulatedLogin = async () => {
    try {
      setLoading(true);
      const randomSeed = Math.floor(100 + Math.random() * 900);
      const defaultName = callsign.trim() || \`Commander_\${randomSeed}\`;
      const res = await ApiClient.loginWithGoogle({
        email: \`\${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com\`,
        name: defaultName,
        picture: \`https://lh3.googleusercontent.com/a/default-user-\${randomSeed}\`,
        community,
      });
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md stitch-card rounded-3xl p-6 sm:p-8 border border-white/10 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8080a0] hover:text-[#eef2ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Authentication</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Google OAuth &amp; Fleet Access</p>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSimulatedLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-white text-[#05050c] font-sans text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-3 mb-5 shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="font-mono text-[10px] text-[#8080a0] uppercase">Or Choose Pilot Callsign</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {/* Callsign & Community Selection */}
        <div className="flex flex-col gap-3 mb-5 text-left">
          <div>
            <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1">Pilot Callsign</label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="e.g. AstroPioneer, NovaPilot..."
              className="w-full bg-[#070714] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-[#00f0ff] placeholder:text-[#8080a0]/40 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1">Community / Fleet</label>
            <select
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#eef2ff] focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="Starfleet Academy">Starfleet Academy</option>
              <option value="Nebula Squad">Nebula Squad</option>
              <option value="Cosmic Voyagers">Cosmic Voyagers</option>
              <option value="Astrophysicists">Astrophysicists</option>
              <option value="Global Explorers">Global Explorers</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleDevPilotLogin(callsign.trim() || 'AstroPioneer', community)}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch as {callsign.trim() || 'AstroPioneer'}</span>
        </button>
      </div>
    </div>
  );
};
`;

// 7. OrbitSolvedModal.tsx with One-Play Lock & Midnight Countdown
const orbitSolvedCode = `import { useState, useEffect, type FC } from 'react';
import type { ScoreBreakdown, AIRoast } from '../types/game';
import { Share2, Trophy, Loader2, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrbitSolvedModalProps {
  guessesCount: number;
  scoreBreakdown?: ScoreBreakdown | null;
  hintsUsed: number;
  roast: AIRoast | null;
  onGenerateRoast: (style: 'friendly' | 'savage' | 'hype') => void;
  loadingRoast: boolean;
  onViewStandings: () => void;
}

export const OrbitSolvedModal: FC<OrbitSolvedModalProps> = ({
  guessesCount,
  scoreBreakdown,
  hintsUsed,
  roast,
  onGenerateRoast,
  loadingRoast,
  onViewStandings,
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(\`\${hours.toString().padStart(2, '0')}:\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    const text = \`🌌 ORBITO DAILY PUZZLE SOLVED!\\n🎯 Guesses: \${guessesCount}\\n💡 Hints: \${hintsUsed}\\n🏆 Score: \${scoreBreakdown?.finalScore || 1000}/1000\\n\\nPlay today's orbit: http://localhost:5173\`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg stitch-solved-card rounded-3xl p-6 sm:p-8 border border-[#ff9d00]/30 shadow-2xl relative flex flex-col items-center text-center"
      >
        {/* Solved Title with Amber Glow */}
        <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-[#ff9d00] mb-1 drop-shadow-[0_0_20px_rgba(255,157,0,0.4)]">
          SOLVED!
        </h1>
        <p className="font-mono text-xs text-[#8080a0] uppercase tracking-widest mb-4">
          in {guessesCount} {guessesCount === 1 ? 'guess' : 'guesses'}
        </p>

        {/* AI Roast Terminal Card */}
        <div className="w-full stitch-terminal rounded-2xl p-4 sm:p-5 border border-white/10 mb-5 text-left relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
            <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3 h-3 text-[#00f0ff]" />
              [&gt;] SYSTEM_ANALYSIS // AI_ROAST
            </span>

            {/* Style Switcher */}
            <div className="flex gap-1.5">
              {(['savage', 'friendly', 'hype'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onGenerateRoast(style)}
                  disabled={loadingRoast}
                  className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[#8080a0] hover:text-[#eef2ff] transition-all disabled:opacity-50"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {loadingRoast ? (
            <div className="py-4 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00f0ff] animate-spin" />
              <span className="font-mono text-xs text-[#00f0ff]">Generating neural reaction...</span>
            </div>
          ) : (
            <p className="font-mono text-xs text-[#eef2ff] leading-relaxed italic">
              "{roast?.roastText || 'Orbital target acquired with surgical precision. Trajectory locked in record time.'}"
            </p>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 mb-5"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'TELEMETRY COPIED!' : 'SHARE ORBIT TELEMETRY >'}</span>
        </button>

        {/* 3 Metric Pods */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
          <div className="stitch-card rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="font-mono text-[9px] text-[#8080a0] uppercase">Score</span>
            <span className="font-mono text-base font-bold text-[#00f0ff]">
              {scoreBreakdown?.finalScore || 1000}
            </span>
          </div>

          <div className="stitch-card rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="font-mono text-[9px] text-[#8080a0] uppercase">Time</span>
            <span className="font-mono text-base font-bold text-[#eef2ff]">02:14</span>
          </div>

          <div className="stitch-card rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="font-mono text-[9px] text-[#8080a0] uppercase">Hints Used</span>
            <span className="font-mono text-base font-bold text-[#ff9d00]">{hintsUsed}</span>
          </div>
        </div>

        {/* Action: Space Standings & Midnight Countdown (One-Play Rule) */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onViewStandings}
            className="w-full py-3 px-4 rounded-xl border border-white/10 bg-[#070714] text-[#eef2ff] font-mono text-xs font-bold uppercase tracking-wider hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-[#ff9d00]" />
            <span>View Space Standings</span>
          </button>

          <div className="py-2 px-3 rounded-xl bg-[#0c0c1f] border border-white/5 flex items-center justify-center gap-2 text-center">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-mono text-[10px] text-[#8080a0]">
              Next Daily Orbit in <strong className="text-[#00f0ff]">{countdown}</strong>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
`;

// 8. App.tsx
const appCode = `import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MissionControlLanding } from './components/MissionControlLanding';
import { DailyOrbitDesktop } from './components/DailyOrbitDesktop';
import { OrbitSolvedModal } from './components/OrbitSolvedModal';
import { SpaceStandingsView } from './components/SpaceStandingsView';
import { AuthModal } from './components/AuthModal';
import { ApiClient } from './api/client';
import type { SessionSummary, AIRoast, UserProfile } from './types/game';

export function App() {
  const [currentView, setCurrentView] = useState<'mission_control' | 'gameplay' | 'solved' | 'standings'>('mission_control');
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roast, setRoast] = useState<AIRoast | null>(null);
  const [loadingRoast, setLoadingRoast] = useState(false);

  // Restore user session
  useEffect(() => {
    const savedUser = localStorage.getItem('orbito_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
  }, []);

  const getPlayerId = () => {
    if (user?.id) return user.id;
    let id = localStorage.getItem('orbito_player_id');
    if (!id || id.length !== 36) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : '11111111-2222-3333-4444-555555555555';
      localStorage.setItem('orbito_player_id', id);
    }
    return id;
  };

  const startSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const id = getPlayerId();
      const sess = await ApiClient.startSession(id);
      setSession(sess);

      if (sess.solved || sess.status === 'solved') {
        setCurrentView('solved');
        loadRoast(sess.sessionId, 'savage');
      } else {
        setCurrentView('gameplay');
      }
    } catch (err: any) {
      console.error('Session start error:', err);
      setError(err?.message || 'Could not connect to backend.');
      setCurrentView('gameplay');
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (guess: string) => {
    if (!session) return;
    try {
      const result = await ApiClient.submitGuess(session.sessionId, guess);
      const updatedGuesses = [...(session.guesses || []), result];
      const isSolved = result.isSolved || result.rank === 1;

      setSession({
        ...session,
        guesses: updatedGuesses,
        guessesCount: updatedGuesses.length,
        solved: isSolved,
        score: result.scoreBreakdown?.finalScore ?? session.score,
      });

      if (isSolved) {
        setCurrentView('solved');
        loadRoast(session.sessionId, 'savage');
      }
    } catch (err: any) {
      alert(err.message || 'Guess failed');
    }
  };

  const handleRequestHint = async () => {
    if (!session || loadingHint) return;
    try {
      setLoadingHint(true);
      const res = await ApiClient.requestHint(session.sessionId);
      const currentHints = session.revealedHints || session.unlockedHints || [];
      const updatedHints = [...currentHints, res.hintText];

      setSession({
        ...session,
        hintsUsed: res.hintsUsed,
        revealedHints: updatedHints,
        unlockedHints: updatedHints,
      });
    } catch (err: any) {
      alert(err.message || 'Could not unlock hint');
    } finally {
      setLoadingHint(false);
    }
  };

  const loadRoast = async (sessionId: string, style: 'friendly' | 'savage' | 'hype') => {
    try {
      setLoadingRoast(true);
      const res = await ApiClient.generateRoast(sessionId, style);
      setRoast(res);
    } catch (err) {
      console.error('Roast error:', err);
    } finally {
      setLoadingRoast(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orbito_auth_token');
    localStorage.removeItem('orbito_user');
    setUser(null);
    setCurrentView('mission_control');
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-[#05050c] text-[#eef2ff] overflow-x-hidden">
      <div className="starfield-bg"></div>
      <div className="nebula-glow"></div>

      <Navbar
        activeTab={currentView === 'standings' ? 'standings' : 'play'}
        onSelectTab={(tab) => {
          if (tab === 'standings') setCurrentView('standings');
          if (tab === 'play') {
            if (session) setCurrentView(session.solved ? 'solved' : 'gameplay');
            else startSession();
          }
        }}
        onGoHome={() => setCurrentView('mission_control')}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {currentView === 'mission_control' && (
        <MissionControlLanding
          onLaunch={() => startSession()}
          onOpenComms={() => startSession()}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {currentView === 'gameplay' && (
        loading ? (
          <div className="min-h-screen flex flex-col items-center justify-center gap-3 relative z-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin"></div>
            <p className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase animate-pulse">
              INITIALIZING RADAR SENSORS...
            </p>
          </div>
        ) : session ? (
          <DailyOrbitDesktop
            session={session}
            onGuess={handleGuess}
            onRequestHint={handleRequestHint}
            onReset={() => {
              if (session.solved) {
                alert('Daily orbit completed! Board cannot be reset.');
              } else {
                startSession();
              }
            }}
            loadingHint={loadingHint}
          />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative z-20">
            <p className="font-mono text-sm text-[#ff5e07]">Orbital Uplink Offline</p>
            <p className="font-mono text-xs text-[#8080a0]">{error}</p>
            <button
              onClick={startSession}
              className="py-2 px-6 rounded-full border border-[#00f0ff] text-[#00f0ff] font-mono text-xs uppercase"
            >
              Retry
            </button>
          </div>
        )
      )}

      {currentView === 'solved' && session && (
        <OrbitSolvedModal
          guessesCount={session.guessesCount}
          scoreBreakdown={session.guesses && session.guesses[session.guesses.length - 1]?.scoreBreakdown}
          hintsUsed={session.hintsUsed}
          roast={roast}
          onGenerateRoast={(style) => loadRoast(session.sessionId, style)}
          loadingRoast={loadingRoast}
          onViewStandings={() => setCurrentView('standings')}
        />
      )}

      {currentView === 'standings' && <SpaceStandingsView />}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          startSession();
        }}
      />
    </div>
  );
}

export default App;
`;

fs.writeFileSync(path.join(root, 'src/types/game.ts'), typesCode.trim());
fs.writeFileSync(path.join(root, 'src/api/client.ts'), apiClientCode.trim());
fs.writeFileSync(path.join(root, 'src/components/Navbar.tsx'), navbarCode.trim());
fs.writeFileSync(path.join(root, 'src/components/MissionControlLanding.tsx'), missionLandingCode.trim());
fs.writeFileSync(path.join(root, 'src/components/SpaceStandingsView.tsx'), spaceStandingsCode.trim());
fs.writeFileSync(path.join(root, 'src/components/AuthModal.tsx'), authModalCode.trim());
fs.writeFileSync(path.join(root, 'src/components/OrbitSolvedModal.tsx'), orbitSolvedCode.trim());
fs.writeFileSync(path.join(root, 'src/App.tsx'), appCode.trim());

console.log('✅ Generated 100% dynamic Auth, One-Play rule, and Community Leaderboards!');

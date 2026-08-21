import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

const spaceStandingsCode = `import { useState, useEffect, type FC } from 'react';
import type { LeaderboardEntry, UserProfile } from '../types/game';
import { ApiClient } from '../api/client';
import { RefreshCw, Users, KeyRound, Trophy } from 'lucide-react';

interface SpaceStandingsViewProps {
  user: UserProfile | null;
  onOpenCommunity: () => void;
  activeRoomCode?: string | null;
}

export const SpaceStandingsView: FC<SpaceStandingsViewProps> = ({
  user,
  onOpenCommunity,
  activeRoomCode,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>(activeRoomCode ? 'Room' : 'Global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeRoomCode) {
      setActiveTab('Room');
    }
  }, [activeRoomCode]);

  useEffect(() => {
    loadStandings(activeTab);
  }, [activeTab, activeRoomCode]);

  const loadStandings = async (tab: string) => {
    try {
      setLoading(true);
      const roomFilter = tab === 'Room' && activeRoomCode ? activeRoomCode : undefined;
      const res = await ApiClient.getLeaderboard({ roomCode: roomFilter });
      setEntries(res.leaderboard || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCommunityName = user?.community && user.community !== 'Global Explorers'
    ? user.community
    : activeRoomCode
    ? \`Room \${activeRoomCode}\`
    : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
      <div className="mb-8">
        <h1 className="font-mono text-2xl sm:text-4xl font-black text-[#eef2ff] uppercase tracking-wider">
          Space Standings
        </h1>
        <p className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest mt-1 font-bold">
          Real-Time Leaderboards // Today's Orbit
        </p>
      </div>

      {/* Clean Tab Switcher: Global & User's Custom Community Room */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
        <button
          onClick={() => setActiveTab('Global')}
          className={\`px-5 py-2.5 rounded-2xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 \${
            activeTab === 'Global'
              ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_20px_rgba(0,240,255,0.4)]'
              : 'bg-[#070714] text-[#8080a0] hover:text-[#eef2ff] border border-white/10'
          }\`}
        >
          <span>🌐 Global Standings</span>
        </button>

        {currentCommunityName && (
          <button
            onClick={() => setActiveTab('Room')}
            className={\`px-5 py-2.5 rounded-2xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 \${
              activeTab === 'Room'
                ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                : 'bg-[#070714] text-[#00f0ff] hover:text-[#eef2ff] border border-[#00f0ff]/30'
            }\`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>🛸 \${currentCommunityName}</span>
          </button>
        )}

        <button
          onClick={onOpenCommunity}
          className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-[#8080a0] hover:text-[#00f0ff] hover:border-[#00f0ff]/40 font-mono text-xs font-bold uppercase transition-all flex items-center gap-2"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>{currentCommunityName ? 'Switch / Join Room' : '+ Join / Create Community Room'}</span>
        </button>
      </div>

      <div className="stitch-card rounded-3xl p-4 sm:p-6 border border-white/10 text-left overflow-x-auto shadow-2xl">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[#8080a0] uppercase text-[10px]">
              <th className="py-3 px-3 text-left">Rank</th>
              <th className="py-3 px-3 text-left">Pilot</th>
              <th className="py-3 px-3 text-left">Community Fleet</th>
              <th className="py-3 px-3 text-center">Probes</th>
              <th className="py-3 px-3 text-right">Final Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-[#8080a0]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00f0ff]" />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-[#8080a0]">
                  <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                    <Trophy className="w-8 h-8 text-[#8080a0]/40" />
                    <p className="font-bold text-[#eef2ff]">No Pilots Ranked Yet</p>
                    <p className="text-[11px] text-[#8080a0]">Be the first astronaut to solve today's orbit in this leaderboard!</p>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <tr
                  key={entry.userId || idx}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-3">
                    <span className={\`font-black \${
                      idx === 0
                        ? 'text-[#00ff88]'
                        : idx === 1
                        ? 'text-[#00f0ff]'
                        : idx === 2
                        ? 'text-[#ffaa00]'
                        : 'text-[#8080a0]'
                    }\`}>
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : \`#\${idx + 1}\`}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={entry.avatarUrl || \`https://api.dicebear.com/7.x/bottts/svg?seed=\${encodeURIComponent(entry.name || entry.username)}\`}
                        alt="Pilot Avatar"
                        className="w-7 h-7 rounded-full border border-white/20 bg-black/40 object-cover"
                      />
                      <span className="font-bold text-[#eef2ff]">{entry.name || entry.username}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[10px] text-[#00f0ff] font-bold">
                      {entry.community}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center text-[#eef2ff]">
                    {entry.guessesCount}
                  </td>

                  <td className="py-3.5 px-3 text-right font-black text-sm text-[#00ff88]">
                    {entry.score}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path.join(root, 'src/components/SpaceStandingsView.tsx'), spaceStandingsCode.trim());
console.log('✅ Applied clean SpaceStandingsView with only Global and User Custom Community Room!');

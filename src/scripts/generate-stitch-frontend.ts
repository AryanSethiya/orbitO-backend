import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('aryansethiya111@gmail.com');
  const [pilotName, setPilotName] = useState('Aryan Sethiya');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      const picture = payload?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`;
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
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectGoogleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter a valid Google email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const name = pilotName.trim() || email.split('@')[0];
      const picture = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

      const res = await ApiClient.loginWithGoogle({
        email: email.trim().toLowerCase(),
        name,
        picture,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md stitch-card rounded-3xl p-6 sm:p-8 border border-white/10 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8080a0] hover:text-[#eef2ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Authentication</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Google OAuth 2.0 Access</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Official Google Sign In Button */}
        <div className="w-full flex flex-col items-center justify-center mb-4 bg-[#0c0c1f] p-4 rounded-2xl border border-[#00f0ff]/20">
          <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-3 font-bold tracking-wider">
            Sign in with Google Account
          </label>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In prompt closed or failed.')}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            width="100%"
          />
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="font-mono text-[10px] text-[#8080a0] uppercase">Or Quick Launch with Callsign</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {/* Callsign / Direct Sign-In fallback */}
        <div className="flex flex-col gap-3 text-left">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1">Google Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
                className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#eef2ff] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1">Pilot Callsign</label>
              <input
                type="text"
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="Aryan Sethiya"
                className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#eef2ff] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
          </div>

          <button
            id="launch-auth-btn"
            onClick={handleDirectGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider active:scale-95 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <span>Launch as {pilotName || 'Pilot'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

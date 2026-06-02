/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { isFirebaseActive, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { Sparkles, User, LogOut, Film, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  user: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
}

export default function AuthInterface({ user, onUserChange }: Props) {
  const [demoName, setDemoName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const uProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email || 'user@example.com',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Member',
        };
        onUserChange(uProfile);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification cancelled or rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) {
      setError('Name is required to launch space');
      return;
    }
    setError('');
    const uid = 'demo_' + Math.random().toString(36).substr(2, 9);
    const uProfile: UserProfile = {
      uid,
      email: `${demoName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      displayName: demoName,
    };
    onUserChange(uProfile);
  };

  const handleSignOut = async () => {
    try {
      if (isFirebaseActive) {
        await fbSignOut(auth);
      }
      onUserChange(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3.5 glass px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-display font-medium text-[#e5a00d] shadow-md select-none">
            {user.displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight font-sans flex items-center gap-1.5">
              {user.displayName}
              {user.uid.startsWith('demo_') ? (
                <span className="text-[9px] font-mono bg-[#e5a00d]/10 text-[#e5a00d] px-1.5 py-0.5 rounded border border-[#e5a00d]/20 font-normal">Demo</span>
              ) : (
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-normal">Verified</span>
              )}
            </div>
            <div className="text-xs text-gray-400 font-mono truncate max-w-[150px] sm:max-w-none">{user.email}</div>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          id="btn-signout"
          className="hover:bg-red-500/10 text-gray-400 hover:text-red-400 p-2 rounded-lg transition-all border border-transparent hover:border-red-500/20 flex gap-2 w-full sm:w-auto items-center justify-center text-xs font-mono"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full glass rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#e5a00d]/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
      <div className="absolute inset-0 star-field pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <Film className="w-6 h-6 text-[#e5a00d] animate-spin-slow" />
        <h2 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-1">
          Cine<span className="text-[#e5a00d] font-serif italic">AI</span> Workspace
        </h2>
      </div>

      <p className="text-white/60 text-xs mb-6 leading-relaxed relative z-10">
        Unlock real-time review sentiment analytics, compile custom watchlists, and store movie critiques securely.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 font-mono relative z-10">
          {error}
        </div>
      )}

      {isFirebaseActive ? (
        <div className="space-y-4 relative z-10">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            id="btn-google-login"
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-full font-sans text-xs uppercase tracking-wider font-semibold transition-all border border-white/10 active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.317 1.832 15.497 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.55-4.435 10.55-10.715 0-.726-.075-1.282-.175-1.7zm0 0z"
              />
            </svg>
            {loading ? 'Entering CineAI...' : 'Connect Google Account'}
          </button>
          
          <div className="flex items-center gap-2 justify-center text-[10px] text-emerald-400 font-mono bg-emerald-500/5 py-2 px-3 rounded-lg border border-emerald-500/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            Fortressed Cloud Persistence Active
          </div>
        </div>
      ) : (
        <div className="space-y-5 relative z-10">
          <form onSubmit={handleDemoSignIn} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Your Persona Name</label>
              <input
                type="text"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="e.g. Captain Cinephile"
                maxLength={40}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-full focus:outline-none focus:border-[#e5a00d]/50 transition-all placeholder:text-white/20 text-xs font-sans"
              />
            </div>
            <button
              type="submit"
              id="btn-demo-login"
              className="w-full flex items-center justify-center gap-2 bg-[#e5a00d] hover:bg-[#ffb61e] text-black font-sans font-bold text-xs uppercase tracking-widest py-2.5 rounded-full transition-all shadow-lg active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Launch Sandbox Mode
            </button>
          </form>

          <div className="flex items-start gap-2 bg-white/5 py-2.5 px-3 rounded-xl border border-white/10 text-[11px] text-white/60 leading-relaxed font-sans">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#e5a00d] mt-0.5" />
            <div>
              <span className="font-semibold text-white">Firebase sandbox ready</span>: We have initialized simulation structures. Feel free to use Sandbox mode! Your watchlist and ratings load instantly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

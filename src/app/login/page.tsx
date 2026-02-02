'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate access code first
        const response = await fetch('/api/auth/validate-access-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Invalid access code');
        }

        await signUp(email, password);
        setError('Check your email to confirm your account!');
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] p-4">
      {/* Glitch Title */}
      <div className="relative mb-8">
        <h1 className="text-5xl md:text-6xl font-black italic text-black tracking-tight glitch-wrapper" data-text="WINTER ARC">
          <span className="glitch-layer glitch-cyan">WINTER ARC</span>
          <span className="glitch-layer glitch-magenta">WINTER ARC</span>
          <span className="glitch-layer glitch-main">WINTER ARC</span>
        </h1>
      </div>

      {/* Form Card with lime accent border */}
      <div className="relative w-full max-w-md">
        {/* Lime green accent border (offset) */}
        <div className="absolute -left-2 top-2 bottom-[-8px] w-full h-full border-l-[6px] border-b-[6px] border-[#22FF00] rounded-sm pointer-events-none" />

        {/* Main card */}
        <div className="relative bg-white p-8 border-3 border-black rounded-sm">
          {/* Member Access Header */}
          <div className="mb-8">
            <h2 className="text-xl font-bold uppercase tracking-wide flex items-center gap-3">
              <span className="text-[#22FF00] text-2xl">■</span>
              MEMBER ACCESS
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code (Sign-up only) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Access Code
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-4 py-4 border-3 border-black rounded-sm text-sm uppercase tracking-wider placeholder:text-gray-400 placeholder:uppercase focus:outline-none focus:border-[#22FF00] transition-colors"
                  placeholder="ENTER ACCESS CODE"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 pr-12 border-3 border-black rounded-sm text-sm uppercase tracking-wider placeholder:text-gray-400 placeholder:uppercase focus:outline-none focus:border-[#22FF00] transition-colors"
                  placeholder="YOU@EXAMPLE.COM"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black font-bold text-lg">
                  @
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {/* TODO: Implement password reset */}}
                    className="text-xs font-bold uppercase tracking-wider text-black hover:text-[#22FF00] transition-colors"
                  >
                    LOST KEY?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-12 border-3 border-black rounded-sm text-sm tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-[#22FF00] transition-colors"
                  placeholder="••••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-[#22FF00] transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`text-sm font-bold p-3 border-2 rounded-sm ${error.includes('Check your email') ? 'text-green-600 border-green-600 bg-green-50' : 'text-red-600 border-red-600 bg-red-50'}`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#22FF00] text-black font-bold uppercase tracking-wider border-3 border-black rounded-sm shadow-brutal hover:shadow-brutal-lg hover:bg-[#1ADB00] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'PROCESSING...' : 'ENTER THE GRIND'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                {isSignUp ? 'Already in the grind? ' : 'New Challenger? '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-sm font-bold uppercase underline underline-offset-2 hover:text-[#22FF00] transition-colors"
              >
                {isSignUp ? 'SIGN IN' : 'INITIATE SIGN UP'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Glitch Animation Styles */}
      <style jsx>{`
        .glitch-wrapper {
          position: relative;
          display: inline-block;
        }

        .glitch-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-main {
          position: relative;
          color: #000;
          z-index: 3;
        }

        .glitch-cyan {
          color: #00ffff;
          z-index: 1;
          animation: glitch-cyan 2s infinite linear;
        }

        .glitch-magenta {
          color: #ff00ff;
          z-index: 2;
          animation: glitch-magenta 2s infinite linear;
        }

        @keyframes glitch-cyan {
          0%, 100% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          5% {
            transform: translate(-4px, 2px);
          }
          10% {
            transform: translate(-4px, -2px);
            clip-path: inset(10% 0 85% 0);
          }
          15% {
            transform: translate(-3px, 1px);
          }
          20% {
            transform: translate(-3px, 2px);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translate(-4px, -1px);
          }
          30% {
            transform: translate(-3px, 2px);
            clip-path: inset(65% 0 20% 0);
          }
          35%, 50% {
            transform: translate(-3px, 1px);
            clip-path: inset(0 0 0 0);
          }
          55% {
            transform: translate(-4px, 2px);
            clip-path: inset(40% 0 45% 0);
          }
          60% {
            transform: translate(-3px, -2px);
          }
          65% {
            transform: translate(-4px, 1px);
            clip-path: inset(0 0 0 0);
          }
          70% {
            transform: translate(-3px, 2px);
          }
          75% {
            transform: translate(-4px, -1px);
            clip-path: inset(80% 0 5% 0);
          }
          80%, 95% {
            transform: translate(-3px, 1px);
            clip-path: inset(0 0 0 0);
          }
        }

        @keyframes glitch-magenta {
          0%, 100% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          5% {
            transform: translate(4px, -2px);
          }
          10% {
            transform: translate(3px, 2px);
            clip-path: inset(70% 0 15% 0);
          }
          15% {
            transform: translate(4px, -1px);
          }
          20% {
            transform: translate(3px, -2px);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translate(4px, 1px);
          }
          30% {
            transform: translate(3px, -2px);
            clip-path: inset(25% 0 60% 0);
          }
          35%, 50% {
            transform: translate(4px, -1px);
            clip-path: inset(0 0 0 0);
          }
          55% {
            transform: translate(3px, -2px);
            clip-path: inset(55% 0 30% 0);
          }
          60% {
            transform: translate(4px, 2px);
          }
          65% {
            transform: translate(3px, -1px);
            clip-path: inset(0 0 0 0);
          }
          70% {
            transform: translate(4px, -2px);
          }
          75% {
            transform: translate(3px, 1px);
            clip-path: inset(5% 0 80% 0);
          }
          80%, 95% {
            transform: translate(4px, -1px);
            clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
    </div>
  );
}

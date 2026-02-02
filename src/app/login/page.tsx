'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="max-w-md w-full space-y-8 bg-card-light dark:bg-card-dark p-8 rounded-sm shadow-brutal border-3 border-black dark:border-white">
        <div>
          <h2 className="text-center text-3xl font-bold uppercase tracking-wide text-text-light dark:text-text-dark">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-4 text-center text-sm text-subtext-light dark:text-subtext-dark">
            Winter Arc is a fitness app to generate programs and log your workouts, powered by AI.
            <br />
            If you wanna try it, contact me <a href="https://github.com/openmikasa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">@openmikasa</a> on GitHub.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="accessCode" className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-1">
                  Access Code
                </label>
                <input
                  id="accessCode"
                  name="accessCode"
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="block w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm placeholder-subtext-light dark:placeholder-subtext-dark focus:outline-none focus:border-accent focus:shadow-brutal-sm dark:bg-card-dark dark:text-white transition-all"
                  placeholder="Enter access code"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm placeholder-subtext-light dark:placeholder-subtext-dark focus:outline-none focus:border-accent focus:shadow-brutal-sm dark:bg-card-dark dark:text-white transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm placeholder-subtext-light dark:placeholder-subtext-dark focus:outline-none focus:border-accent focus:shadow-brutal-sm dark:bg-card-dark dark:text-white transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className={`text-sm font-bold p-3 border-2 rounded-sm ${error.includes('Check your email') ? 'text-success border-success bg-success/10' : 'text-danger border-danger bg-danger/10'}`}>
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 rounded-sm text-sm font-bold uppercase text-white bg-primary border-3 border-black dark:border-white shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm text-primary hover:underline font-bold transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (retryAfter > 0) {
      timer = setInterval(() => {
        setRetryAfter(prev => {
          const newValue = Math.max(0, prev - 1);
          if (newValue === 0) {
            setIsRateLimited(false);
            setError('');
          }
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('rate limit')) {
          setIsRateLimited(true);
          // Get retry time from error message if available, otherwise use 60 seconds
          const retryTime = signInError.message.match(/try again after (\d+)/)?.[1];
          setRetryAfter(retryTime ? parseInt(retryTime) : 60);
          setError('Too many sign-in attempts. Please wait before trying again.');
          return;
        }
        setError(signInError.message);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-md text-sm">
              {error}
              {retryAfter > 0 && (
                <div className="mt-2">
                  Please wait {retryAfter} seconds before trying again.
                </div>
              )}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRateLimited}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isRateLimited}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isRateLimited}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : isRateLimited ? `Try again in ${retryAfter}s` : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
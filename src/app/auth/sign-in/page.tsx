'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

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
      const { error: signInError, data: session } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('rate limit')) {
          setIsRateLimited(true);
          const retryTime = signInError.message.match(/try again after (\d+)/)?.[1];
          setRetryAfter(retryTime ? parseInt(retryTime) : 60);
          setError('Too many sign-in attempts. Please wait before trying again.');
          return;
        }
        setError(signInError.message);
        return;
      }

      // Get user's role
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (roleError || !userData?.role) {
        setError('Error fetching user role');
        return;
      }

      // Redirect based on role
      const roleRoutes = {
        Customer: '/customer',
        Worker: '/worker',
        Admin: '/admin'
      };

      const redirectPath = roleRoutes[userData.role as keyof typeof roleRoutes] || '/auth/sign-in';
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-bold">Sign in</h2>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="alert alert-error text-sm">
                <span>{error}</span>
                {retryAfter > 0 && (
                  <span className="block mt-1">
                    Try again in {retryAfter}s
                  </span>
                )}
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRateLimited}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isRateLimited}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading || isRateLimited}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="divider my-4">OR</div>

          <Link
            href="/auth/sign-up"
            className="btn btn-outline btn-sm w-full"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
} 
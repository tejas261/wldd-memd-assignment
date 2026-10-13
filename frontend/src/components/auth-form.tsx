'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import type { Role, User } from '@/types';
import { ErrorNotice, Logo } from './ui';

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>('creator');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User }>('/auth/me', { signal: controller.signal })
      .then(({ user }) => router.replace(`/${user.role}`))
      .catch(() => {});
    return () => controller.abort();
  }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const fields = new FormData(event.currentTarget);
    const body = {
      email: fields.get('email'),
      password: fields.get('password'),
      ...(signup ? { name: fields.get('name'), role } : {}),
    };
    try {
      const result = await api<{ user: User }>(`/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.replace(`/${result.user.role}`);
    } catch (error) {
      setError(message(error));
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Logo />
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <h1>{signup ? 'Create an account' : 'Log in'}</h1>
          <p>{signup ? 'Choose a role to get started.' : 'Access your campaigns and earnings.'}</p>
          <form onSubmit={submit}>
            {signup && (
              <fieldset className="role-picker">
                <legend>Account type</legend>
                {(['creator', 'brand'] as const).map((value) => (
                  <label key={value} className={role === value ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                    />
                    <strong>{value === 'creator' ? 'Creator' : 'Brand'}</strong>
                    <span>
                      {value === 'creator'
                        ? 'Submit posts and earn'
                        : 'Create and manage campaigns'}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {signup && (
              <label className="field">
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                name="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                placeholder={signup ? 'At least 8 characters' : 'Your password'}
                minLength={signup ? 8 : undefined}
                maxLength={72}
                required
              />
            </label>
            {error && <ErrorNotice error={error} />}
            <button className="button primary full" disabled={busy}>
              {busy ? 'One moment…' : signup ? 'Create account' : 'Log in'}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

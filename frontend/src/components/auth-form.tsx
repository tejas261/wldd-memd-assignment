'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card } from './ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import type { Role, User } from '@/types';
import { ErrorNotice, Logo } from './ui';

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const id = useId();
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
      <Card className="auth-panel">
        <div className="auth-form-wrap">
          <h1>{signup ? 'Create an account' : 'Log in'}</h1>
          <p>{signup ? 'Choose a role to get started.' : 'Access your campaigns and earnings.'}</p>
          <form onSubmit={submit}>
            {signup && (
              <fieldset>
                <legend id={`${id}-role-label`} className="mb-2">
                  Account type
                </legend>
                <RadioGroup
                  name="role"
                  value={role}
                  onValueChange={(value) => setRole(value as Role)}
                  aria-labelledby={`${id}-role-label`}
                  className="role-picker"
                >
                  {(['creator', 'brand'] as const).map((value) => (
                    <Label
                      key={value}
                      htmlFor={`${id}-${value}`}
                      className={role === value ? 'selected' : ''}
                    >
                      <RadioGroupItem id={`${id}-${value}`} value={value} />
                      <strong>{value === 'creator' ? 'Creator' : 'Brand'}</strong>
                      <span>
                        {value === 'creator'
                          ? 'Submit posts and earn'
                          : 'Create and manage campaigns'}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
            )}
            {signup && (
              <Label className="field">
                Your name
                <Input
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </Label>
            )}
            <Label className="field">
              Email address
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </Label>
            <Label className="field">
              Password
              <Input
                type="password"
                name="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                placeholder={signup ? 'At least 8 characters' : 'Your password'}
                minLength={signup ? 8 : undefined}
                maxLength={72}
                required
              />
            </Label>
            {error && <ErrorNotice error={error} />}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'One moment…' : signup ? 'Create account' : 'Log in'}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}

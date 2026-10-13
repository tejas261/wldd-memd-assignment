'use client';

import { Button } from '@/components/ui/button';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, LogOut, Radio } from 'lucide-react';
import type { Role, User } from '@/types';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import { ErrorNotice, Logo } from './ui';
import { Skeleton } from './skeletons';

export function Shell({
  user,
  role,
  children,
}: {
  user: User | null;
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' });
      router.replace('/login');
    } catch (error) {
      setError(message(error));
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Logo />
        <div className="workspace-label">{role === 'brand' ? 'Brand' : 'Creator'} workspace</div>
        <nav
          aria-label="Main navigation"
          className={role === 'creator' ? 'creator-navigation' : undefined}
        >
          <Link
            className={`nav-item ${pathname === `/${role}` ? 'active' : ''}`}
            href={`/${role}`}
            aria-current={pathname === `/${role}` ? 'page' : undefined}
          >
            <LayoutGrid size={18} />
            Dashboard
          </Link>
          {role === 'creator' && (
            <Link
              className={`nav-item ${pathname === '/creator/campaigns' ? 'active' : ''}`}
              href="/creator/campaigns"
              aria-current={pathname === '/creator/campaigns' ? 'page' : undefined}
            >
              <Radio size={18} />
              Live campaigns
            </Link>
          )}
        </nav>
        <div className="profile" aria-busy={!user}>
          {user ? (
            <>
              <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.role === 'brand' ? 'Brand account' : 'Creator account'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Log out"
                aria-label="Log out"
                disabled={busy}
                onClick={logout}
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : (
            <>
              <Skeleton className="avatar" width={32} height={32} />
              <div className="skeleton-stack">
                <Skeleton width={90} />
                <Skeleton width={70} height={11} />
              </div>
              <span className="sr-only" role="status">
                Loading account…
              </span>
            </>
          )}
        </div>
      </aside>
      <div className="workspace">
        <main id="main" className="main-content">
          {error && <ErrorNotice error={error} />} {children}
        </main>
      </div>
    </div>
  );
}

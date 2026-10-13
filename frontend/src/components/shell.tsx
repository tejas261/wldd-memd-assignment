'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Wallet, Radio } from 'lucide-react';
import type { User } from '@/types';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import { ErrorNotice, Logo } from './ui';

export function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();
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
        <div className="workspace-label">
          {user.role === 'brand' ? 'Brand' : 'Creator'} workspace
        </div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href={`/${user.role}`} aria-current="page">
            <LayoutGrid size={18} />
            Overview
          </a>
          <a className="nav-item" href="#campaigns">
            <Radio size={18} />
            Campaigns
          </a>
          {user.role === 'creator' && (
            <a className="nav-item" href="#earnings">
              <Wallet size={18} />
              My submissions
            </a>
          )}
        </nav>
        <div className="profile">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === 'brand' ? 'Brand account' : 'Creator account'}</span>
          </div>
          <button
            className="icon-button"
            title="Log out"
            aria-label="Log out"
            disabled={busy}
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            {user.role === 'brand' ? 'Brand' : 'Creator'} <span className="muted">/</span>{' '}
            <strong>Overview</strong>
          </span>
          <span className="muted">Campaign payout tracker</span>
        </header>
        <main id="main" className="main-content">
          {error && <ErrorNotice error={error} />} {children}
        </main>
      </div>
    </div>
  );
}

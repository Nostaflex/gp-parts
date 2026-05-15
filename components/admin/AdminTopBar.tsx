'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, RefreshCw, LogOut, UserCircle } from 'lucide-react';

import { adminSignOut, onAuthChange, refreshAdminSession } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';

const IOS = {
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
  bgHover: 'rgba(242, 242, 247, 0.8)',
} as const;

export function AdminTopBar() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => onAuthChange((user) => setEmail(user?.email ?? null)), []);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshAdminSession();
      showToast({ type: 'success', message: 'Session actualisée.' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Échec du rafraîchissement.',
      });
    } finally {
      setRefreshing(false);
      setMenuOpen(false);
    }
  }

  async function handleSignOut() {
    await adminSignOut();
    router.push('/admin/login');
  }

  return (
    <header
      className="h-16 shrink-0 flex items-center justify-end gap-2 px-4 sm:px-6 sticky top-0 z-30"
      style={{ background: IOS.surface, borderBottom: `1px solid ${IOS.borderFaint}` }}
    >
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
          style={{ color: IOS.text }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = IOS.bgHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '';
          }}
        >
          <UserCircle size={22} strokeWidth={1.75} style={{ color: IOS.textMuted }} />
          <span className="text-body-sm font-medium max-w-[180px] truncate hidden sm:inline">
            {email ?? 'Admin'}
          </span>
          <ChevronDown size={16} strokeWidth={2} style={{ color: IOS.textMuted }} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-1 w-60 rounded-[14px] shadow-subtle py-1.5 animate-fade-in"
            style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
          >
            {email && (
              <p className="px-4 py-2 text-caption truncate" style={{ color: IOS.textMuted }}>
                {email}
              </p>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-inset"
              style={{ color: IOS.text }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = IOS.bgHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <RefreshCw
                size={16}
                strokeWidth={1.75}
                className={refreshing ? 'animate-spin' : ''}
                style={{ color: IOS.textMuted }}
              />
              {refreshing ? 'Actualisation…' : 'Actualiser la session'}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-inset"
              style={{ color: IOS.text }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = IOS.bgHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <LogOut size={16} strokeWidth={1.75} style={{ color: IOS.textMuted }} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

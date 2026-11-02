import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useSettingsStore } from '../../store/settingsStore';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, settings } = useSettingsStore();

  // Apply dark mode class on html tag
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply accent color dynamic CSS variable
  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--brand-color', settings.accentColor);
    }
  }, [settings.accentColor]);

  // Global keyboard shortcut for search (⌘K or Ctrl+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + K or Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      // Quick slash '/' when not focused on an input or textarea
      if (
        e.key === '/' &&
        !searchOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !document.activeElement?.getAttribute('contenteditable')
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

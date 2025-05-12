import React, { useEffect, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Grid } from './components/Grid';
import { Settings } from './components/Settings';
import { useSpreadsheetStore } from './store';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useSpreadsheetStore();

  useEffect(() => {
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.classList.toggle('dark', isDark);

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Toolbar onOpenSettings={() => setIsSettingsOpen(true)} />
      <Grid />
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
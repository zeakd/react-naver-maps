import { useEffect, useState } from 'react';

export function useIsDarkMode() {
  const [darkMode, setDarkMode] = useState<boolean>();

  useEffect(() => {
    const matchDark = window.matchMedia('(prefers-color-scheme: dark)');

    setDarkMode(matchDark.matches);

    const darkHandler = (event: MediaQueryListEvent) => {
      setDarkMode(event.matches);
    };
    matchDark.addEventListener('change', darkHandler);

    return () => {
      matchDark.removeEventListener('change', darkHandler);
    };
  }, []);

  return darkMode;
}

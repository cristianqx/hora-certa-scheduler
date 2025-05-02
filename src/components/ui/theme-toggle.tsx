
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  // We use a state to make sure we can update the UI immediately when toggling
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // On mount, check if theme is already set in localStorage or prefers-color-scheme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = 
      storedTheme === 'dark' || 
      (!storedTheme && darkModePreference);
    
    setIsDarkMode(isDark);
    updateTheme(isDark);
  }, []);

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    updateTheme(!isDarkMode);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && <span className="text-sm">Modo Escuro</span>}
      <div className="flex items-center">
        <Sun className="h-4 w-4 mr-1 text-yellow-500" />
        <Switch 
          checked={isDarkMode} 
          onCheckedChange={toggleTheme} 
          aria-label="Toggle dark mode"
        />
        <Moon className="h-4 w-4 ml-1 text-slate-700 dark:text-slate-400" />
      </div>
    </div>
  );
}

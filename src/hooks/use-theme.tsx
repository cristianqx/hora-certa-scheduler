
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if there's a theme saved in localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  // Load user theme preference from Supabase if available
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('user_settings')
            .select('theme')
            .eq('user_id', session.user.id)
            .single();
          
          if (data?.theme) {
            setTheme(data.theme as Theme);
          }
        }
      } catch (error) {
        console.error('Error loading user theme:', error);
      }
    };
    
    loadUserTheme();
  }, []);

  // Save theme preference to user settings when it changes
  useEffect(() => {
    const saveUserTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: existingSettings } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (existingSettings) {
            await supabase
              .from('user_settings')
              .update({ theme })
              .eq('id', existingSettings.id);
          } else {
            await supabase
              .from('user_settings')
              .insert([{ user_id: session.user.id, theme }]);
          }
        }
      } catch (error) {
        console.error('Error saving user theme:', error);
      }
    };

    // Update localStorage and HTML class when theme changes
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    saveUserTheme();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

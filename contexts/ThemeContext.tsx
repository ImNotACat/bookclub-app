import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  background: '#E8E2D8',
  cardBackground: '#FFFFFF',
  primaryText: '#5C4A3D',
  secondaryText: '#8B7355',
  tertiaryText: '#D4CFC5',
  accent: '#8B7355',
  accentDark: '#5C4A3D',
  border: '#E8E2D8',
  danger: '#D04444',
};

export const darkTheme = {
  background: '#1A1613',
  cardBackground: '#2D2721',
  primaryText: '#E8E2D8',
  secondaryText: '#C4BDB0',
  tertiaryText: '#8B7355',
  accent: '#B8A896',
  accentDark: '#D4CFC5',
  border: '#3D3731',
  danger: '#E87676',
};

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('theme').then((value) => {
      if (value === 'dark') {
        setIsDark(true);
      }
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

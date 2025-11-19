import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoaderContextType {
  isLoading: boolean;
  show: () => void;
  hide: () => void;
  setLoading: (loading: boolean) => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const show = useCallback(() => setIsLoading(true), []);
  const hide = useCallback(() => setIsLoading(false), []);
  const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);

  return (
    <LoaderContext.Provider value={{ isLoading, show, hide, setLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within LoaderProvider');
  }
  return context;
};

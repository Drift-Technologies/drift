import React, { createContext, useContext, ReactNode } from 'react';

export type ParamsContextType = {
  username: string;
  user_id: string;
  setParams: (params: { username: string; user_id: string }) => void;
};

const ParamsContext = createContext<ParamsContextType | null>(null);

export const ParamsProvider: React.FC<{ children: any; value: any }> = ({ children, value }) => (
  <ParamsContext.Provider value={value}>{children}</ParamsContext.Provider>
);

export const useParams = () => {
  const context = useContext(ParamsContext);
  if (!context) {
    throw new Error('useParams must be used within a ParamsProvider');
  }
  return context;
};

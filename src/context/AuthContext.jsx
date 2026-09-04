import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

const AuthContext = createContext({
  currentUser: null,
  userRole: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const authState = useAuthHook();

  return (
    <AuthContext.Provider value={authState}>
      {!authState.loading && children}
    </AuthContext.Provider>
  );
};

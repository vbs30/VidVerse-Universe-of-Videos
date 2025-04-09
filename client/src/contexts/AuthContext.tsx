'use client'

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

export interface User {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
    coverImage: string;
    email: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    checkAuth: () => Promise<boolean>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
    checkAuth: async () => false,
    isLoading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(0);

    // Make checkAuth a memoized function
    const checkAuth = useCallback(async (): Promise<boolean> => {
        // Only check if more than 10 seconds have passed since last check
        // unless this is the first check (lastChecked === 0)
        const now = Date.now();
        if (lastChecked !== 0 && now - lastChecked < 10000) {
            return isAuthenticated;
        }

        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:8000/api/v1/users/get-current-user', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                }
            });

            const data = await response.json();
            setLastChecked(now);

            if (data.success) {
                setUser(data.data);
                setIsAuthenticated(true);
                return true;
            } else {
                setUser(null);
                setIsAuthenticated(false);
                return false;
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            setUser(null);
            setIsAuthenticated(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [lastChecked, isAuthenticated]);

    // Initial auth check
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        setLastChecked(Date.now());
    };

    const logout = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/users/logout', {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();
            if (data.success) {
                setUser(null);
                setIsAuthenticated(false);
                setLastChecked(Date.now());
            }
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            checkAuth,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
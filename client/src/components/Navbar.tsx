'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Search, Sun, Moon, X, User, MonitorPause, LogOut } from 'lucide-react';
import Link from 'next/link';
import { SignUpBox } from './SignupBox';
import { LoginBox } from './LoginBox';

interface User {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
    email: string;
}

export function Navbar({ className, ...props }: React.ComponentProps<"div">) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const { theme, setTheme } = useTheme();
    const isDarkTheme = theme === 'dark';

    const toggleTheme = () => setTheme(isDarkTheme ? 'light' : 'dark');

    const searchRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);

        // Fetch current user
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/users/get-current-user', {
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.success) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch user', error);
            }
        };

        fetchCurrentUser();
    }, []);

    // Logout handler
    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/users/logout', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                setUser(null);
            }
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add method to update user state externally
    const updateUserState = (userData: User | null) => {
        setUser(userData);
    };

    const renderDesktopAuthContent = () => {
        if (user) {
            return (
                <div className="flex items-center gap-4">
                    <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <button
                        onClick={handleLogout}
                        className={`rounded-full py-1 px-4 border flex items-center gap-2 ${isDarkTheme
                            ? 'border-white text-white hover:bg-gray-800'
                            : 'border-black text-black hover:bg-gray-100'}`}
                    >
                        Logout
                    </button>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-4">
                <LoginBox
                    className={`rounded-full py-1 px-4 border flex items-center gap-2 ${isDarkTheme ? 'border-white text-white hover:bg-gray-800' : 'border-black text-black hover:bg-gray-100'}`}
                    onLoginSuccess={(userData) => updateUserState(userData)}
                />
                <SignUpBox
                    className={`rounded-full py-1 px-4 border flex items-center gap-2 ${isDarkTheme ? 'border-white text-white hover:bg-gray-800' : 'border-black text-black hover:bg-gray-100'}`}
                    onSignupSuccess={(userData) => updateUserState(userData)}
                />
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        );
    };

    const renderMobileMenuContent = () => {
        if (user) {
            return (
                <div ref={menuRef} className="absolute top-12 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                    <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700">
                        <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>{user.username}</span>
                    </div>
                    <Link href="#" className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        My Profile
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                    <button onClick={toggleTheme} className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />} Toggle Theme
                    </button>
                </div>
            );
        }

        return (
            <div ref={menuRef} className="absolute top-12 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                <LoginBox className={`w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md`} />
                <SignUpBox className={`w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md`} />
                <button onClick={toggleTheme} className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />} Toggle Theme
                </button>
            </div>
        );
    };

    return (
        <div className={`w-full p-4 sticky top-0 z-50 border-b ${isDarkTheme ? 'bg-gray-900 text-white border-gray-700' : 'bg-sidebar text-gray-800 border-gray-200'}`}>
            <div className="flex items-center justify-between max-w-8xl mx-auto relative">
                {/* Logo */}
                <Link href='/'>
                    <div className="flex-shrink-0 font-bold text-xl flex items-center gap-2">
                        <MonitorPause size={24} className={`${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} />
                        <div>
                            <span className={`${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`}>Vid</span>
                            <span>Verse</span>
                        </div>
                    </div>
                </Link>

                {/* Desktop Search */}
                <div className="hidden md:flex justify-center flex-1">
                    <div className={`flex items-center w-full max-w-md mx-auto px-2 rounded-lg border ${isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>
                        <input
                            type="text"
                            placeholder="Search..."
                            className={`w-full p-2 outline-none ${isDarkTheme ? 'bg-gray-800 placeholder-gray-500' : 'bg-gray-100 placeholder-gray-500'}`}
                        />
                        <Search size={18} className="mx-2 text-gray-500" />
                    </div>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {renderDesktopAuthContent()}
                </div>

                {/* Mobile View Icons */}
                <div className="flex md:hidden items-center gap-4 relative">
                    {/* Search Icon */}
                    <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Search size={20} />
                    </button>

                    {/* Search Dropdown - Only Takes Right Side */}
                    {isSearchOpen && (
                        <div ref={searchRef} className="absolute top-12 right-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2 w-60">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-black dark:text-white"
                            />
                        </div>
                    )}

                    {/* Hamburger Menu */}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Hamburger Dropdown - Opens on Right Only */}
                    {isMenuOpen && renderMobileMenuContent()}
                </div>
            </div>
        </div>
    );
};
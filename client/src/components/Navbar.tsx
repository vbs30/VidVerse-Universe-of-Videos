'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Sun, Moon, X, LogOut, UserRoundCog, MonitorPause } from 'lucide-react';
import Link from 'next/link';
import { SignUpBox } from './SignupBox';
import { LoginBox } from './LoginBox';
import { useAuth } from '@/contexts/AuthContext';
import { SearchComponent } from './SearchComponent';

export function Navbar({ className, ...props }: React.ComponentProps<"div">) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { theme, setTheme } = useTheme();
    const isDarkTheme = theme === 'dark';

    // Use the AuthContext
    const { user, logout } = useAuth();

    const toggleTheme = () => setTheme(isDarkTheme ? 'light' : 'dark');

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        onClick={logout}
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
                />
                <SignUpBox
                    className={`rounded-full py-1 px-4 border flex items-center gap-2 ${isDarkTheme ? 'border-white text-white hover:bg-gray-800' : 'border-black text-black hover:bg-gray-100'}`}
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
                    <Link href="#" className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <UserRoundCog size={18} /> My Profile
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                    <button onClick={toggleTheme} className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />} Toggle Theme
                    </button>
                </div>
            );
        }

        return (
            <div ref={menuRef} className="absolute top-12 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                <LoginBox
                    className={`w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md`}
                />
                <SignUpBox
                    className={`w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md`}
                />
                <button onClick={toggleTheme} className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />} Toggle Theme
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
                    <SearchComponent isDarkTheme={isDarkTheme} />
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {renderDesktopAuthContent()}
                </div>

                {/* Mobile View Icons */}
                <div className="flex md:hidden items-center gap-4 relative">
                    {/* Search Icon */}
                    <SearchComponent isDarkTheme={isDarkTheme} isMobile={true} />

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
}
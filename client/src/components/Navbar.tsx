'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Search, Sun, Moon, X, User, MonitorPause } from 'lucide-react';
import Link from 'next/link';

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { theme, setTheme } = useTheme();
    const isDarkTheme = theme === 'dark';

    const toggleTheme = () => setTheme(isDarkTheme ? 'light' : 'dark');

    const searchRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

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

    return (
        <nav className={`w-full p-4 sticky top-0 z-50 border-b ${isDarkTheme ? 'bg-gray-900 text-white border-gray-700' : 'bg-sidebar text-gray-800 border-gray-200'}`}>
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
                    <Link href='/signup'>
                        <button className={`rounded-full py-1 px-4 border flex items-center gap-2 ${isDarkTheme ? 'border-white text-white hover:bg-gray-800' : 'border-black text-black hover:bg-gray-100'}`}>
                            <User size={16} /> Sign In
                        </button>
                    </Link>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
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
                    {isMenuOpen && (
                        <div ref={menuRef} className="absolute top-12 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                            <Link href='/signup'>
                                <button className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                    <User size={16} /> Sign In
                                </button>
                            </Link>
                            <button onClick={toggleTheme} className="w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />} Toggle Theme
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

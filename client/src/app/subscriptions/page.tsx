'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from "@/components/ui/separator";

interface Channel {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
    coverImage: string;
    email: string;
}

interface SubscriptionData {
    _id: string;
    username: string;
    countofChannels: number;
    channels: Channel[];
}

const SubscriptionsPage = () => {
    const { user, isAuthenticated } = useAuth();
    const [subscriptions, setSubscriptions] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000/api/v1/subscription/u/${user.username}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (data.success) {
                    setSubscriptions(data.data[0]);
                } else {
                    setError('Failed to fetch subscriptions');
                }
            } catch (err) {
                setError('An error occurred while fetching subscriptions');
                console.error('Subscription fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchSubscriptions();
        } else {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-800">
                <div className="text-center bg-white dark:bg-black p-8 rounded-lg shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Required</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Please log in to view your channel.</p>
                    <button
                        onClick={() => window.location.href = '/login'} // Adjust this to your login route
                        className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your subscriptions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="text-center bg-white dark:bg-black p-8 rounded-lg shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    if (!subscriptions || subscriptions.channels.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Subscriptions</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300 mb-6">You haven't subscribed to any channels yet.</p>
                    <Link href="/explore" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Explore Channels
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-black">
            {/* Category header - fixed at the top */}
            <header className="flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-black px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Your Subscription List</h1>
                </div>
            </header>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You're subscribed to {subscriptions.countofChannels} channel{subscriptions.countofChannels !== 1 ? 's' : ''}
                    </p>

                    <div className="flex flex-col space-y-4 max-w-3xl mx-auto pb-8">
                        {subscriptions.channels.map((channel) => (
                            <Link key={channel._id} href={`/channel/${channel.username}`} className="block w-full">
                                <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="border-white dark:border-gray-700">
                                        <img
                                            src={channel.avatar || "/api/placeholder/128/128"}
                                            alt={channel.username}
                                            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-gray-950 dark:border-white shadow-md object-cover"
                                        />
                                    </div>

                                    <div className="ml-4 flex-grow">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{channel.fullName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">@{channel.username}</p>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <div className="text-blue-600 dark:text-blue-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionsPage;
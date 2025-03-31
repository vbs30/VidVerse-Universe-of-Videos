'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="text-center p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Not Logged In</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Please log in to view your subscriptions.</p>
                    <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[70vh] px-4">
                <div className="text-center p-8 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 max-w-md w-full">
                    <h2 className="text-xl font-medium text-red-800 dark:text-red-200 mb-2">Error</h2>
                    <p className="text-red-600 dark:text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    if (!subscriptions || subscriptions.channels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="text-center p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">No Subscriptions</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">You haven't subscribed to any channels yet.</p>
                    <Link href="/explore" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Explore Channels
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Subscriptions</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    You're subscribed to {subscriptions.countofChannels} channel{subscriptions.countofChannels !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="flex flex-col space-y-4 max-w-3xl mx-auto">
                {subscriptions.channels.map((channel) => (
                    <Link href={`/channel/${channel.username}`} className="block w-full">
                        <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="h-16 w-16 rounded-full overflow-hidden relative flex-shrink-0 border-2 border-white dark:border-gray-700">
                                <img
                                    src={channel.avatar || "/api/placeholder/128/128"}
                                    alt={channel.username}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-950 shadow-md object-cover"
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
    );
};

export default SubscriptionsPage;
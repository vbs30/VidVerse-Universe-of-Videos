'use client'

import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { History, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Video {
    _id: string;
    videoFile: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: string;
    views: number;
    ownerId: string;
    ownerName: string;
    createdAt: string;
    updatedAt: string;
}

interface WatchHistoryResponse {
    statusCode: number;
    data: Video[];
    message: string;
    success: boolean;
}

const WatchHistoryPage: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [watchHistory, setWatchHistory] = useState<Video[]>([]);
    const [authChecked, setAuthChecked] = useState(false);

    // Format duration
    const formatDuration = (duration: string): string => {
        // If duration is already formatted as 00:00:00, return it
        if (/^\d{2}:\d{2}:\d{2}$/.test(duration)) {
            // Remove leading zeros from hours if it's 00
            return duration.replace(/^00:/, '');
        }
        return duration;
    };

    // Format date for timeAgo
    const getTimeAgo = (dateString: string): string => {
        const now = new Date();
        const createdAt = new Date(dateString);

        const diffTime = now.getTime() - createdAt.getTime();
        const diffSeconds = Math.floor(diffTime / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
        if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
        return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    };

    // Format view count
    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    // Truncate text
    const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    // Format date for grouping videos by day
    const formatDateForGroup = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            // Format as "Monday, April 7" or similar
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }
    };

    // Group videos by day
    const groupVideosByDay = (videos: Video[]): Record<string, Video[]> => {
        const grouped: Record<string, Video[]> = {};

        videos.forEach(video => {
            const dateGroup = formatDateForGroup(video.updatedAt);
            if (!grouped[dateGroup]) {
                grouped[dateGroup] = [];
            }
            grouped[dateGroup].push(video);
        });

        return grouped;
    };

    useEffect(() => {
        // Set authChecked to true once user and isAuthenticated have been determined
        if (user !== undefined || isAuthenticated !== undefined) {
            setAuthChecked(true);
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        // Only attempt to fetch if auth check is complete
        if (!authChecked) {
            return; // Wait for auth state to be determined
        }

        const fetchWatchHistory = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const response = await fetch('http://localhost:8000/api/v1/users/watch-history', {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch watch history");
                }

                const data: WatchHistoryResponse = await response.json();

                if (!data.success) {
                    throw new Error(data.message || "Failed to load watch history");
                }

                setWatchHistory(data.data);
            } catch (err) {
                console.error("Error fetching watch history:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                toast.error("Failed to load watch history");
            } finally {
                setLoading(false);
            }
        };

        fetchWatchHistory();
    }, [isAuthenticated, user, authChecked]);

    // Show loading state while authentication is being determined
    if (!authChecked || (authChecked && isAuthenticated && loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                        {!authChecked ? "Checking authentication..." : "Loading your watch history..."}
                    </p>
                </div>
            </div>
        );
    }

    // Show login required message if user is not authenticated
    if (authChecked && !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mb-4">
                        <History size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In Required</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Please sign in to view your watch history.
                    </p>
                    <Link href="/login">
                        <button className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200">
                            Sign In
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Group videos by day
    const groupedVideos = groupVideosByDay(watchHistory);

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Watch History</h1>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
                <div className="max-w-screen-xl mx-auto">
                    {/* Watch History Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <History size={24} className="text-red-600" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Your watch history
                            </h2>
                        </div>

                        {watchHistory.length === 0 ? (
                            <div className="py-16 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">No watch history</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    Videos that you watch will appear here. Start exploring to discover new content!
                                </p>
                                <Link href="/">
                                    <button className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200">
                                        Explore Videos
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedVideos).map(([dateGroup, videos]) => (
                                    <div key={dateGroup}>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 px-3">
                                            {dateGroup}
                                        </h3>
                                        <div className="space-y-4">
                                            {videos.map((video) => (
                                                <div key={video._id} className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors duration-200">
                                                    {/* Thumbnail with duration - clickable to video */}
                                                    <Link href={`/videos/${video._id}`} className="relative flex-shrink-0 sm:w-64 w-full h-44 sm:h-36 rounded-lg overflow-hidden block">
                                                        <img
                                                            src={video.thumbnail || "/api/placeholder/640/360"}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                                                            {formatDuration(video.duration)}
                                                        </div>
                                                    </Link>

                                                    {/* Video details */}
                                                    <div className="flex-1 flex flex-col">
                                                        {/* Title - clickable to video */}
                                                        <Link href={`/videos/${video._id}`}>
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-red-600 dark:hover:text-red-500 transition-colors duration-200">
                                                                {video.title}
                                                            </h3>
                                                        </Link>

                                                        <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <span>{formatViews(Number(video.views))} views</span>
                                                            <span className="mx-1">•</span>
                                                            <span>{getTimeAgo(video.createdAt)}</span>
                                                        </div>

                                                        <div className="mt-2 flex items-center">
                                                            <Link href={`/channel/${video.ownerName}`}>
                                                                <div className="flex items-center group">
                                                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors duration-200">
                                                                        {video.ownerName}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        </div>

                                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                            {truncateText(video.description, 120)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchHistoryPage;
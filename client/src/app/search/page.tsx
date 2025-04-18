'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Loader2 } from 'lucide-react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import VideoGallery from '@/components/VideoGallery';

// Types for the API responses
interface Channel {
    _id: string; // Let's ensure we handle this correctly
    username: string;
    email: string;
    avatar: string;
    coverImage: string;
    fullName: string;
    createdAt: string;
    subscribersCount: number;
    channelSubscriptionCount: number;
    isSubscribed: boolean;
}

interface Video {
    _id: string; // Let's ensure we handle this correctly
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
    __v: number;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [activeTab, setActiveTab] = useState(0);
    const [videos, setVideos] = useState([]);
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError('');

            try {
                // Fetch videos
                const videosResponse = await fetch('http://localhost:8000/api/v1/dashboard/all-videos');
                const videosData = await videosResponse.json();

                // Fetch channels
                const channelsResponse = await fetch('http://localhost:8000/api/v1/subscription/all-channels');
                const channelsData = await channelsResponse.json();

                if (videosData.success && channelsData.success) {
                    // Filter videos by query
                    const filteredVideos = videosData.data.filter((video: Video) =>
                        video.title.toLowerCase().includes(query.toLowerCase()) ||
                        video.description.toLowerCase().includes(query.toLowerCase()) ||
                        video.ownerName.toLowerCase().includes(query.toLowerCase())
                    );

                    // Filter channels by query
                    const filteredChannels = channelsData.data.filter((channel: Channel) =>
                        channel.username.toLowerCase().includes(query.toLowerCase()) ||
                        channel.fullName.toLowerCase().includes(query.toLowerCase())
                    );

                    setVideos(filteredVideos);
                    setChannels(filteredChannels);
                } else {
                    setError('Failed to fetch data');
                }
            } catch (err) {
                setError('Error fetching search results');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (query) {
            fetchData();
        }
    }, [query]);

    if (!query) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="text-center p-12 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">No Search Query</h2>
                    <p>Please enter a search term to find videos and channels.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-6">Search Results for &quot;{query}&quot;</h1>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin mr-2" />
                        Loading search results...
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                ) : (
                    <Tabs
                        selectedIndex={activeTab}
                        onSelect={(index) => setActiveTab(index)}
                        className="search-tabs"
                    >
                        <TabList className="flex mb-6 border-b">
                            <Tab className="px-4 py-2 font-medium cursor-pointer border-b-2 border-transparent hover:border-purple-500 hover:text-purple-500 transition-colors mr-4">
                                All Results ({videos.length + channels.length})
                            </Tab>
                            <Tab className="px-4 py-2 font-medium cursor-pointer border-b-2 border-transparent hover:border-purple-500 hover:text-purple-500 transition-colors mr-4">
                                Videos ({videos.length})
                            </Tab>
                            <Tab className="px-4 py-2 font-medium cursor-pointer border-b-2 border-transparent hover:border-purple-500 hover:text-purple-500 transition-colors">
                                Channels ({channels.length})
                            </Tab>
                        </TabList>

                        <div className="overflow-y-auto scrollbar-hide max-h-[calc(100vh-100px)] pb-16">
                            <TabPanel>
                                {videos.length === 0 && channels.length === 0 ? (
                                    <div className="text-center p-8 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                                        <h2 className="text-xl font-medium mb-2">No results found for &quot;{query}&quot;</h2>
                                    </div>
                                ) : (
                                    <>
                                        {channels.length > 0 && (
                                            <div className="mb-10">
                                                <h2 className="text-2xl font-bold mb-4">Channels</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                                    {channels.slice(0, 4).map((channel, index) => (
                                                        <ChannelCard key={`channel-${index}`} channel={channel} />
                                                    ))}
                                                </div>

                                                {channels.length > 4 && (
                                                    <div className="mt-4 text-center">
                                                        <button onClick={() => setActiveTab(2)}
                                                            className="px-4 py-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                                        >
                                                            Show all {channels.length} channels
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {videos.length > 0 && (
                                            <div className="mb-10">
                                                <h2 className="text-2xl font-bold mb-4">Videos</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                    {videos.slice(0, 6).map((video, index) => (
                                                        <VideoCard key={`video-${index}`} video={video} />
                                                    ))}
                                                </div>

                                                {videos.length > 6 && (
                                                    <div className="mt-4 text-center">
                                                        <button onClick={() => setActiveTab(1)}
                                                            className="px-4 py-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                                        >
                                                            Show all {videos.length} videos
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabPanel>

                            <TabPanel>
                                {videos.length === 0 ? (
                                    <div className="text-center p-8 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                                        <h2 className="text-xl font-medium mb-2">No videos found for &quot;{query}&quot;</h2>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {videos.map((video, index) => (
                                            <VideoCard key={`video-${index}`} video={video} />
                                        ))}
                                    </div>
                                )}
                            </TabPanel>

                            <TabPanel>
                                {channels.length === 0 ? (
                                    <div className="text-center p-8 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                                        <h2 className="text-xl font-medium mb-2">No channels found for &quot;{query}&quot;</h2>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {channels.map((channel, index) => (
                                            <ChannelCard key={`channel-${index}`} channel={channel} />
                                        ))}
                                    </div>
                                )}
                            </TabPanel>
                        </div>
                    </Tabs>
                )}
            </div>
        </div>
    );
}

// Video Card Component
function VideoCard({ video }: { video: Video }) {
    // Format date for videos and channel creation
    const getTimeAgo = (dateString: string): string => {
        const now = new Date();
        const createdAt = new Date(dateString);

        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());

        const diffInDays = Math.floor((nowDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "Yesterday";
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    // Format the full date
    // const formatDate = (dateString: string): string => {
    //     const date = new Date(dateString);
    //     return date.toLocaleDateString('en-US', {
    //         year: 'numeric',
    //         month: 'long',
    //         day: 'numeric'
    //     });
    // };

    // Format view count
    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    // Using index instead of ID for the link since we're not sure if _id exists
    return (
        <Link href={`/videos/${video._id}`} className="block bg-white dark:bg-neutral-900 rounded-lg overflow-hidden">
            <VideoGallery
                key={video._id}
                title={video.title}
                channelName={video.ownerName}
                views={`${formatViews(Number(video.views))} views`}
                timeAgo={getTimeAgo(video.createdAt)}
                duration={video.duration}
                thumbnailUrl={video.thumbnail}
            />
        </Link>
    );
}

// Channel Card Component
function ChannelCard({ channel }: { channel: Channel }) {
    // Using index instead of ID for the link since we're not sure if _id exists
    return (
        <Link href={`/channel/${channel.username}`} className="block bg-white dark:bg-neutral-800 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
                {channel.avatar ? (
                    <img src={channel.avatar} alt={channel.username} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-500" />
                    </div>
                )}
            </div>

            <h3 className="font-medium text-lg mb-1">{channel.username}</h3>
            {channel.fullName && channel.fullName !== channel.username && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {channel.fullName}
                </div>
            )}
        </Link>
    );
}
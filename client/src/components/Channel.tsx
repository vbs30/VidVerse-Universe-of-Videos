'use client'

import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Users } from "lucide-react";
import VideoGallery from "@/components/VideoGallery";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth hook
import Link from "next/link";

interface ChannelData {
  _id: string;
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
  __v: number;
}

interface ChannelResponse {
  statusCode: number;
  data: ChannelData;
  message: string;
  success: boolean;
}

interface VideosResponse {
  statusCode: number;
  data: {
    videos: Video[];
    totalVideos: number;
  };
  message: string;
  success: boolean;
}

interface SubscriptionResponse {
  statusCode: number;
  data: string;
  message: string;
  success: boolean;
}

interface ChannelPageProps {
  params: {
    username: string;
  };
}

const ChannelPage: React.FC<ChannelPageProps> = ({ params }) => {
  const { username } = params;
  const { user, isAuthenticated } = useAuth(); // Get auth state from context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [activeTab, setActiveTab] = useState("videos");
  const [subscribing, setSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Add this new function to check subscription status
  const checkSubscriptionStatus = async (channelId: string) => {
    if (!isAuthenticated || !user) {
      setIsSubscribed(false);
      return;
    }

    try {
      const response = await fetch(`https://vidverse-backend.vercel.app/api/v1/subscription/check/${channelId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setIsSubscribed(result.data.isSubscribed);
      }
    } catch (err) {
      console.error("Error checking subscription status:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch channel info first
        const channelResponse = await fetch(`https://vidverse-backend.vercel.app/api/v1/users/c/${encodeURIComponent(username)}`);
        if (!channelResponse.ok) {
          const errorText = await channelResponse.text();
          console.error("Channel fetch error:", channelResponse.status, errorText);
          throw new Error("Failed to fetch channel data");
        }

        const channelResult: ChannelResponse = await channelResponse.json();

        if (!channelResult.success) {
          throw new Error(channelResult.message || "Failed to load channel data");
        }

        // Set channel data immediately so we at least have the channel info
        setChannelData(channelResult.data);

        // Check subscription status after getting channel data
        if (channelResult.data._id) {
          await checkSubscriptionStatus(channelResult.data._id);
        }

        // Fetch channel videos - handle separately
        try {
          const videosResponse = await fetch(`https://vidverse-backend.vercel.app/api/v1/videos/cv/${encodeURIComponent(username)}`);

          if (!videosResponse.ok) {
            console.error("Videos fetch error:", videosResponse.status);
            // Don't throw here, just set empty videos
            setVideos([]);
            setTotalVideos(0);
          } else {
            const videosResult: VideosResponse = await videosResponse.json();

            if (videosResult.success) {
              setVideos(videosResult.data.videos || []);
              setTotalVideos(videosResult.data.totalVideos || 0);
            } else {
              console.warn("Videos fetch returned success: false", videosResult.message);
              // Set empty videos but don't fail the whole page
              setVideos([]);
              setTotalVideos(0);
            }
          }
        } catch (videoErr) {
          console.error("Error fetching videos:", videoErr);
          // Set empty videos but don't fail the whole page
          setVideos([]);
          setTotalVideos(0);
        }

      } catch (err) {
        console.error("Full error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username, isAuthenticated, user]);

  // Handle subscription toggle
  const handleSubscriptionToggle = async () => {
    if (!channelData) return;

    // Check if user is authenticated using AuthContext
    if (!isAuthenticated || !user) {
      toast.error("Please log in to subscribe to channels");
      return;
    }

    try {
      setSubscribing(true);

      const response = await fetch(`https://vidverse-backend.vercel.app/api/v1/subscription/c/${channelData._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result: SubscriptionResponse = await response.json();

      if (result.success) {
        // Toggle subscription status
        const newSubscriptionStatus = !isSubscribed;
        setIsSubscribed(newSubscriptionStatus);

        // Update subscriber count
        setChannelData(prev => {
          if (!prev) return prev;

          const subscribersCount = newSubscriptionStatus
            ? prev.subscribersCount + 1
            : prev.subscribersCount - 1;

          toast.success(newSubscriptionStatus ? "Successfully subscribed" : "Successfully unsubscribed");

          return {
            ...prev,
            subscribersCount: subscribersCount
          };
        });
      } else {
        toast.error(result.message || "Failed to update subscription");
      }
    } catch (err) {
      toast.error("Error updating subscription. Please try again.");
      console.error("Subscription error:", err);
    } finally {
      setSubscribing(false);
    }
  };

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
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format view count
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading channel...</p>
      </div>
    </div>
  );

  if (error) return (
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
          className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
        >
          Refresh
        </button>
      </div>
    </div>
  );

  if (!channelData) return null;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
      {/* Category header - fixed at the top */}
      <header className="flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Channel - Profile</h1>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Channel Banner */}
        <div
          className="w-full h-44 md:h-56 lg:h-64 bg-cover bg-center"
          style={{
            backgroundImage: channelData.coverImage
              ? `url(${channelData.coverImage})`
              : 'linear-gradient(to right, #6366f1, #a855f7)'
          }}
        />

        {/* Channel Info */}
        <div className="max-w-screen-xl mx-auto py-4 px-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 mb-6 md:mb-10">
            {/* Avatar */}
            <div className="flex-shrink-0 ml-1">
              <img
                src={channelData.avatar || "/api/placeholder/128/128"}
                alt={channelData.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-950 shadow-md object-cover"
              />
            </div>

            {/* Channel Details */}
            <div className="flex-1 mt-4 md:mt-0 md:ml-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {channelData.fullName || channelData.username}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                    <p className="text-gray-600 dark:text-gray-400">@{channelData.username}</p>

                    <div className="hidden sm:flex items-center mt-0">
                      <span className="text-gray-400 mx-1">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{channelData.subscribersCount.toLocaleString()}</span> subscribers
                        </span>
                      </div>
                      <span className="text-gray-400 mx-1">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{totalVideos}</span> videos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:hidden items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-medium">{channelData.subscribersCount.toLocaleString()}</span> subscribers
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-medium">{totalVideos}</span> videos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button
                    onClick={handleSubscriptionToggle}
                    disabled={subscribing}
                    className={`
                      flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium transition-colors duration-200
                      ${subscribing ? "opacity-70 cursor-not-allowed" : ""}
                      ${isSubscribed
                        ? "bg-gray-200 dark:bg-gray-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-900 dark:text-white group"
                        : "bg-red-600 hover:bg-red-700 text-white"}
                    `}
                  >
                    {subscribing ? (
                      <span>Processing...</span>
                    ) : isSubscribed ? (
                      <div className="flex items-center">
                        <span className="group-hover:hidden">Subscribed</span>
                        <span className="hidden group-hover:inline">Unsubscribe</span>
                        <ChevronDown size={16} className="ml-1 group-hover:hidden" />
                      </div>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950 z-10">
            <nav className="flex overflow-x-auto scrollbar-none" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveTab("videos")}
                className={`px-4 py-3 font-medium text-sm transition-colors duration-200 border-b-2 whitespace-nowrap ${activeTab === "videos"
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  }`}
              >
                VIDEOS
              </button>
              <button
                onClick={() => setActiveTab("playlists")}
                className={`px-4 py-3 font-medium text-sm transition-colors duration-200 border-b-2 whitespace-nowrap ${activeTab === "playlists"
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  }`}
              >
                PLAYLISTS
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`px-4 py-3 font-medium text-sm transition-colors duration-200 border-b-2 whitespace-nowrap ${activeTab === "about"
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  }`}
              >
                ABOUT
              </button>
            </nav>
          </div>

          {/* Content Section */}
          <div className="py-6 pb-16">
            {activeTab === "videos" && (
              <>
                {videos.length > 0 ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Videos</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {videos.map((video) => (
                        <Link key={video._id} href={`/videos/${video._id}`}>
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
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">No videos uploaded</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      This channel hasn&apos;t uploaded any videos yet. Check back later for new content.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "playlists" && (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">No playlists</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  This channel hasn&apos;t created any playlists yet.
                </p>
              </div>
            )}

            {activeTab === "about" && (
              <div className="max-w-3xl">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="mt-8">
                      <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2">Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 dark:text-gray-400 w-32">Channel name:</span>
                          <span className="text-gray-900 dark:text-white">{channelData.fullName || channelData.username}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 dark:text-gray-400 w-32">Username:</span>
                          <span className="text-gray-900 dark:text-white">@{channelData.username}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 dark:text-gray-400 w-32">Joined:</span>
                          <span className="text-gray-900 dark:text-white">{formatDate(channelData.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Stats</h2>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Subscribers</span>
                          <Users size={16} className="text-gray-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{channelData.subscribersCount.toLocaleString()}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Videos</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalVideos}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Total views</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                          {videos.reduce((sum, video) => sum + video.views, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;
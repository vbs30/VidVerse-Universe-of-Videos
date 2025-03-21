// page.tsx
'use client'

import VideoGallery from "@/components/VideoGallery";
import React, { useState, useEffect, useLayoutEffect } from "react";

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

interface ApiResponse {
  statusCode: number;
  data: Video[];
  message: string;
  success: boolean;
}

export const Home: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0); // Add a key to force re-render

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/api/v1/dashboard/all-videos");
        const data: ApiResponse = await response.json();

        if (data.success) {
          setVideos(data.data);
        } else {
          setError(data.message || "Failed to fetch videos");
        }
      } catch (err) {
        setError("Error fetching videos. Please try again later.");
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Add a resize observer to handle layout changes including sidebar toggle
  useLayoutEffect(() => {
    const handleResize = () => {
      // Force a re-render of the grid when size changes
      setKey(prevKey => prevKey + 1);
    };

    // Create a ResizeObserver to monitor layout changes
    const resizeObserver = new ResizeObserver(handleResize);

    // Observe the document body or parent container
    resizeObserver.observe(document.body);

    // Also add a window resize listener as a fallback
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const createdAt = new Date(dateString);

    // Reset hours to compare just dates
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());

    // Calculate difference in days
    const diffInDays = Math.floor((nowDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (loading) return <div className="text-center py-8">Loading videos...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="w-full px-4 py-6" key={key}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {videos.length > 0 ? videos.map((video) => (
          <VideoGallery
            key={video._id}
            title={video.title}
            channelName={video.ownerName}
            views={`${video.views.toLocaleString()} views`}
            timeAgo={getTimeAgo(video.createdAt)}
            duration={video.duration}
            thumbnailUrl={video.thumbnail}
          />
        )) : (
          <div className="col-span-full text-center py-10 text-gray-500">No videos found</div>
        )}
      </div>
    </div>
  );
};

export default Home;
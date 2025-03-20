'use client'

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

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

export const VideoGallery: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const createdAt = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

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
    <div className="max-w-screen-xl px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.length > 0 ? videos.map((video) => (
          <Home
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

interface VideoCardProps {
  title: string;
  channelName: string;
  views: string;
  timeAgo: string;
  duration: string;
  thumbnailUrl: string;
}

const Home: React.FC<VideoCardProps> = ({
  title,
  channelName,
  views,
  timeAgo,
  duration,
  thumbnailUrl
}) => {
  return (
    <div className="group overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md">
      {/* Thumbnail container - outside the Card component */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnailUrl || "/api/placeholder/320/180"}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded font-medium">
          {duration}
        </div>
      </div>

      {/* Card without default padding at the top to allow thumbnail to flush with card top */}
      <Card className="rounded-t-none border-t-0 py-0 min-h-[135px] max-h-[170px]">
        <CardContent className="p-4">
          <h3 className="font-medium text-base line-clamp-2 mb-1">{title}</h3>
          <p className="text-sm text-gray-700 mb-1">{channelName}</p>
          <p className="text-xs text-gray-500">{views} • {timeAgo}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGallery;
'use client'

import VideoGallery from "@/components/VideoGallery";
import React, { useState, useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const categories: string[] = [
  "Music",
  "Gaming",
  "Vlogs",
  "Cooking & Food",
  "Technology",
  "AI & Machine Learning",
  "Education",
  "Science & Space",
  "Movies & TV Reviews",
  "Sports & Fitness",
  "Travel & Adventure",
  "DIY & Crafts",
  "Business & Finance",
  "News & Politics",
  "Health & Wellness",
  "Comedy & Entertainment",
  "Beauty & Fashion",
  "Motivation & Self-improvement",
  "Photography & Videography",
  "Cars & Automobiles",
];

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState('grid-cols-4');
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width < 640) setGridColumns('grid-cols-1');
        else if (width < 768) setGridColumns('grid-cols-2');
        else if (width < 1024) setGridColumns('grid-cols-3');
        else setGridColumns('grid-cols-4');
      }
    };

    // Initial setup
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  if (loading) return <div className="text-center py-8">Loading videos...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <>
      {/* Category header */}
      <header className=" top-0 flex h-16 shrink-0 items-center border-b bg-background px-4 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={selectedCategory === category ? "default" : "outline"}
                className="whitespace-nowrap flex-shrink-0"
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Video grid */}
      <div
        ref={containerRef}
        className="w-full h-[calc(100vh-128px)] p-4 overflow-y-auto"
      >
        <div
          className={`grid ${gridColumns} gap-4`}
        >
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
    </>
  );
};

export default Home;
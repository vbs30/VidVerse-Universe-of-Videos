'use client'

import VideoGallery from "@/components/VideoGallery";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

export default function Page() {
  const [allVideos, setAllVideos] = useState<Video[]>([]); // All fetched videos
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([]); // Currently displayed videos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState('grid-cols-4');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const VIDEOS_PER_PAGE = 12;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://vidverse-backend.vercel.app/api/v1/dashboard/all-videos");
        const data: ApiResponse = await response.json();

        if (data.success) {
          setAllVideos(data.data);
          // Initially load only the first batch of videos
          setDisplayedVideos(data.data.slice(0, VIDEOS_PER_PAGE));
          setHasMore(data.data.length > VIDEOS_PER_PAGE);
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

  // Load more videos when category changes
  useEffect(() => {
    const filteredVideos = allVideos;

    setDisplayedVideos(filteredVideos.slice(0, VIDEOS_PER_PAGE));
    setPage(1);
    setHasMore(filteredVideos.length > VIDEOS_PER_PAGE);
  }, [selectedCategory, allVideos]);

  // Handle loading more videos
  const loadMoreVideos = useCallback(() => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * VIDEOS_PER_PAGE;
    const endIndex = nextPage * VIDEOS_PER_PAGE;

    const filteredVideos = allVideos;

    if (startIndex < filteredVideos.length) {
      const nextVideos = filteredVideos.slice(startIndex, endIndex);
      setDisplayedVideos(prev => [...prev, ...nextVideos]);
      setPage(nextPage);
      setHasMore(endIndex < filteredVideos.length);
    } else {
      setHasMore(false);
    }
  }, [allVideos, hasMore, loading, page, selectedCategory]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreVideos();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreVideos, loading, hasMore]);

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

  // Format view count
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  if (loading && page === 1) return <div className="text-center py-8">Loading videos...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <>
      {/* Category header */}
      <header className="top-0 flex h-16 shrink-0 items-center border-b bg-background px-4 z-10">
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
        className="w-full h-[calc(100vh-128px)] p-4 overflow-y-auto scrollbar-hide"
      >
        <div className={`grid ${gridColumns} gap-4`}>
          {displayedVideos.length > 0 ? displayedVideos.map((video) => (
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
          )) : (
            <div className="col-span-full text-center py-10 text-gray-500">No videos found</div>
          )}
        </div>

        {/* Loading indicator for infinite scroll */}
        {hasMore && (
          <div
            ref={loadingRef}
            className="text-center py-4 mt-2"
          >
            {loading && page > 1 ? (
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status">
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <span className="text-gray-400">Scroll for more videos</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
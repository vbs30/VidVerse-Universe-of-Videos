'use client'

import { Card, CardContent } from "@/components/ui/card";

interface VideoCardProps {
    title: string;
    channelName: string;
    views: string;
    timeAgo: string;
    duration: string;
    thumbnailUrl: string;
}

const VideoGallery: React.FC<VideoCardProps> = ({
    title,
    channelName,
    views,
    timeAgo,
    duration,
    thumbnailUrl
}) => {
    return (
        <div className="group overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md pb-4">
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
'use client'

import { useEffect, useRef, useReducer } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import CommentSection from '@/components/CommentComponent';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ThumbsUp, Download, Clock, Eye, ChevronDown } from 'lucide-react'
import VideoGallery from "@/components/VideoGallery";
import { toast } from "sonner";
import Link from 'next/link'

// Interfaces
interface Video {
    _id: string
    videoFile: string
    thumbnail: string
    title: string
    description: string
    duration: string
    views: number
    ownerId: string
    ownerName: string
    createdAt: string
    updatedAt: string
}

interface Channel {
    _id: string
    username: string
    email: string
    fullName: string
    avatar: string
    coverImage: string
    createdAt: string
    subscribersCount: number
    channelSubscriptionCount: number
    isSubscribed: boolean
}

interface Playlist {
    _id: string
    name: string
    description: string
    owner: string
    videoCount: number
}

interface VideoComponentProps {
    videoid: string
}

// Define state interface
interface State {
    video: Video | null
    channel: Channel | null
    isLoading: boolean
    isLiked: boolean
    likesCount: number
    error: string
    subscribing: boolean
    isSubscribed: boolean
    recommendedVideos: Video[]
    loadingRecommended: boolean
    playlists: Playlist[]
    loadingPlaylists: boolean
    savingToPlaylist: boolean
    isPlaylistDialogOpen: boolean
}

// Define action types
type Action =
    | { type: 'SET_LOADING', payload: boolean }
    | { type: 'SET_ERROR', payload: string }
    | { type: 'SET_VIDEO', payload: Video }
    | { type: 'SET_CHANNEL', payload: Channel }
    | { type: 'SET_LIKES_COUNT', payload: number }
    | { type: 'SET_IS_LIKED', payload: boolean }
    | { type: 'SET_SUBSCRIBING', payload: boolean }
    | { type: 'SET_IS_SUBSCRIBED', payload: boolean }
    | { type: 'UPDATE_SUBSCRIBER_COUNT', payload: number }
    | { type: 'SET_RECOMMENDED_VIDEOS', payload: Video[] }
    | { type: 'SET_LOADING_RECOMMENDED', payload: boolean }
    | { type: 'SET_PLAYLISTS', payload: Playlist[] }
    | { type: 'SET_LOADING_PLAYLISTS', payload: boolean }
    | { type: 'SET_SAVING_TO_PLAYLIST', payload: boolean }
    | { type: 'SET_PLAYLIST_DIALOG_OPEN', payload: boolean }

// Initial state
const initialState: State = {
    video: null,
    channel: null,
    isLoading: true,
    isLiked: false,
    likesCount: 0,
    error: '',
    subscribing: false,
    isSubscribed: false,
    recommendedVideos: [],
    loadingRecommended: false,
    playlists: [],
    loadingPlaylists: false,
    savingToPlaylist: false,
    isPlaylistDialogOpen: false
}

// Reducer function
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false }
        case 'SET_VIDEO':
            return { ...state, video: action.payload }
        case 'SET_CHANNEL':
            return { ...state, channel: action.payload }
        case 'SET_LIKES_COUNT':
            return { ...state, likesCount: action.payload }
        case 'SET_IS_LIKED':
            return { ...state, isLiked: action.payload }
        case 'SET_SUBSCRIBING':
            return { ...state, subscribing: action.payload }
        case 'SET_IS_SUBSCRIBED':
            return { ...state, isSubscribed: action.payload }
        case 'UPDATE_SUBSCRIBER_COUNT':
            if (!state.channel) return state
            return {
                ...state,
                channel: {
                    ...state.channel,
                    subscribersCount: action.payload
                }
            }
        case 'SET_RECOMMENDED_VIDEOS':
            return { ...state, recommendedVideos: action.payload }
        case 'SET_LOADING_RECOMMENDED':
            return { ...state, loadingRecommended: action.payload }
        case 'SET_PLAYLISTS':
            return { ...state, playlists: action.payload }
        case 'SET_LOADING_PLAYLISTS':
            return { ...state, loadingPlaylists: action.payload }
        case 'SET_SAVING_TO_PLAYLIST':
            return { ...state, savingToPlaylist: action.payload }
        case 'SET_PLAYLIST_DIALOG_OPEN':
            return { ...state, isPlaylistDialogOpen: action.payload }
        default:
            return state
    }
}

export default function VideoComponent({ videoid }: VideoComponentProps) {
    const { isAuthenticated, user } = useAuth()
    const [state, dispatch] = useReducer(reducer, initialState)
    const videoRef = useRef<HTMLVideoElement>(null)

    const {
        video,
        channel,
        isLoading,
        isLiked,
        likesCount,
        error,
        subscribing,
        isSubscribed,
        recommendedVideos,
        loadingRecommended,
        playlists,
        loadingPlaylists,
        savingToPlaylist,
        isPlaylistDialogOpen
    } = state

    // Fetch video data
    useEffect(() => {
        const fetchVideoData = async () => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true })
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/v/${videoid}`)
                const data = await response.json()

                if (data.success) {
                    dispatch({ type: 'SET_VIDEO', payload: data.data })

                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/view/${videoid}`, {
                        method: 'GET',
                        credentials: 'include',
                    });

                    // Fetch channel data once we have the video owner's username
                    const channelResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/c/${encodeURIComponent(data.data.ownerName)}`
                    )
                    const channelData = await channelResponse.json()

                    if (channelData.success) {
                        dispatch({ type: 'SET_CHANNEL', payload: channelData.data })

                        // Check subscription status after getting channel data
                        if (channelData.data._id && isAuthenticated) {
                            await checkSubscriptionStatus(channelData.data._id)
                        }

                        // Fetch recommended videos from the same channel
                        await fetchRecommendedVideos(data.data.ownerName, data.data._id)
                    }

                    // Get total likes count first
                    await fetchLikesCount()

                    // Fetch like status for authenticated user
                    if (isAuthenticated) {
                        await checkUserLikeStatus()
                    }
                } else {
                    dispatch({ type: 'SET_ERROR', payload: 'Failed to load video' })
                }
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: 'An error occurred while fetching data' })
                console.error(err)
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        }

        if (videoid) {
            fetchVideoData()
        }
    }, [videoid, isAuthenticated])

    // Check subscription status
    const checkSubscriptionStatus = async (channelId: string) => {
        if (!isAuthenticated || !user) {
            dispatch({ type: 'SET_IS_SUBSCRIBED', payload: false })
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscription/check/${channelId}`, {
                credentials: 'include',
            })

            if (response.ok) {
                const result = await response.json()
                dispatch({ type: 'SET_IS_SUBSCRIBED', payload: result.data.isSubscribed })
            }
        } catch (err) {
            console.error("Error checking subscription status:", err)
        }
    }

    // Fetch recommended videos from the same channel
    const fetchRecommendedVideos = async (channelUsername: string, currentVideoId: string) => {
        try {
            dispatch({ type: 'SET_LOADING_RECOMMENDED', payload: true })
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/cv/${encodeURIComponent(channelUsername)}`)

            if (response.ok) {
                const result = await response.json()

                if (result.success) {
                    // Filter out the current video and limit to 10 videos
                    const filteredVideos = result.data.videos
                        .filter((v: Video) => v._id !== currentVideoId)
                        .slice(0, 10)

                    dispatch({ type: 'SET_RECOMMENDED_VIDEOS', payload: filteredVideos })
                } else {
                    console.warn("Videos fetch returned success: false", result.message)
                    dispatch({ type: 'SET_RECOMMENDED_VIDEOS', payload: [] })
                }
            } else {
                console.error("Videos fetch error:", response.status)
                dispatch({ type: 'SET_RECOMMENDED_VIDEOS', payload: [] })
            }
        } catch (err) {
            console.error("Error fetching recommended videos:", err)
            dispatch({ type: 'SET_RECOMMENDED_VIDEOS', payload: [] })
        } finally {
            dispatch({ type: 'SET_LOADING_RECOMMENDED', payload: false })
        }
    }

    // Separate function to fetch likes count
    const fetchLikesCount = async () => {
        try {
            const likesCountResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/likes/count/${videoid}`
            )
            const likesCountData = await likesCountResponse.json()

            if (likesCountData.success) {
                dispatch({ type: 'SET_LIKES_COUNT', payload: likesCountData.data.count })
            }
        } catch (err) {
            console.error('Error fetching likes count:', err)
        }
    }

    // Separate function to check user's like status
    const checkUserLikeStatus = async () => {
        try {
            const likesResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/likes/check-likes/${videoid}`,
                {
                    credentials: 'include',
                }
            )
            const likesData = await likesResponse.json()

            if (likesData.success) {
                dispatch({ type: 'SET_IS_LIKED', payload: likesData.data.isLiked })
            }
        } catch (err) {
            console.error('Error checking like status:', err)
        }
    }

    // Fetch user playlists
    const fetchUserPlaylists = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to access playlists")
            return
        }

        try {
            dispatch({ type: 'SET_LOADING_PLAYLISTS', payload: true })
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist/get-user-playlist`, {
                credentials: 'include',
            })

            const result = await response.json()

            if (result.success) {
                dispatch({ type: 'SET_PLAYLISTS', payload: result.data })
            } else {
                toast.error(result.message || "Failed to load playlists")
            }
        } catch (err) {
            console.error("Error fetching playlists:", err)
            toast.error("Error loading playlists. Please try again.")
        } finally {
            dispatch({ type: 'SET_LOADING_PLAYLISTS', payload: false })
        }
    }

    // Add video to playlist
    const addVideoToPlaylist = async (playlistId: string) => {
        if (!isAuthenticated || !video) {
            toast.error("Please log in to save videos")
            return
        }

        try {
            dispatch({ type: 'SET_SAVING_TO_PLAYLIST', payload: true })
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist/add/${video._id}/${playlistId}`, {
                method: 'PATCH',
                credentials: 'include',
            })

            const result = await response.json()

            if (result.success) {
                toast.success(result.message || "Video added to playlist")
                dispatch({ type: 'SET_PLAYLIST_DIALOG_OPEN', payload: false })
            } else {
                toast.error(result.message || "Failed to add video to playlist")
            }
        } catch (err) {
            console.error("Error adding to playlist:", err)
            toast.error("Error saving video. Please try again.")
        } finally {
            dispatch({ type: 'SET_SAVING_TO_PLAYLIST', payload: false })
        }
    }

    // Toggle like
    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to like videos")
            return
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/likes/toggle/v/${videoid}`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            )

            const data = await response.json()

            if (data.success) {
                // After toggling, refresh both the like status and count from the server
                // rather than trying to calculate it locally
                await checkUserLikeStatus()
                await fetchLikesCount()
            }
        } catch (err) {
            console.error('Error toggling like:', err)
            toast.error("Error updating like. Please try again.")
        }
    }

    // Handle subscription toggle
    const handleSubscriptionToggle = async () => {
        if (!channel) return

        // Check if user is authenticated
        if (!isAuthenticated || !user) {
            toast.error("Please log in to subscribe to channels")
            return
        }

        try {
            dispatch({ type: 'SET_SUBSCRIBING', payload: true })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscription/c/${channel._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })

            const result = await response.json()

            if (result.success) {
                // Toggle subscription status
                const newSubscriptionStatus = !isSubscribed
                dispatch({ type: 'SET_IS_SUBSCRIBED', payload: newSubscriptionStatus })

                // Update subscriber count
                if (channel) {
                    const newSubscriberCount = newSubscriptionStatus
                        ? channel.subscribersCount + 1
                        : channel.subscribersCount - 1

                    dispatch({ type: 'UPDATE_SUBSCRIBER_COUNT', payload: newSubscriberCount })

                    toast.success(newSubscriptionStatus ? "Successfully subscribed" : "Successfully unsubscribed")
                }
            } else {
                toast.error(result.message || "Failed to update subscription")
            }
        } catch (err) {
            toast.error("Error updating subscription. Please try again.")
            console.error("Subscription error:", err)
        } finally {
            dispatch({ type: 'SET_SUBSCRIBING', payload: false })
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy')
        } catch (err) {
            console.log(err)
            return 'Unknown date'
        }
    }

    // Download video
    const handleDownload = () => {
        if (!isAuthenticated) {
            toast.error("Please log in to download videos")
            return
        }

        if (video?.videoFile) {
            const link = document.createElement('a')
            link.href = video.videoFile
            link.download = `${video.title || 'video'}.mp4`
            link.click()
        }
    }

    // Format view count
    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
        return views.toString()
    }

    // Get time ago for videos
    const getTimeAgo = (dateString: string): string => {
        const now = new Date()
        const createdAt = new Date(dateString)

        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())

        const diffInDays = Math.floor((nowDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffInDays === 0) return "Today"
        if (diffInDays === 1) return "Yesterday"
        if (diffInDays < 7) return `${diffInDays} days ago`
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
        return `${Math.floor(diffInDays / 365)} years ago`
    }

    // Handle playlist dialog open
    const handlePlaylistDialogOpen = () => {
        if (!isAuthenticated) {
            toast.error("Please log in to save videos")
            return
        }
        fetchUserPlaylists()
        dispatch({ type: 'SET_PLAYLIST_DIALOG_OPEN', payload: true })
    }

    // Rendering logic - this is the continued code from paste-2.txt
    if (isLoading) {
        return (
            <div className="w-full flex flex-col lg:flex-row overflow-auto h-screen">
                {/* Left section (full width on mobile, 60% on desktop) */}
                <div className="w-full lg:w-3/5 px-4 py-4">
                    <Skeleton className="w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg mb-6" />
                    <div className="flex flex-col space-y-4">
                        <Skeleton className="w-3/4 h-8" />
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-8 w-40" />
                        </div>
                    </div>
                </div>
                {/* Right section (hidden on mobile, 40% on desktop) */}
                <div className="hidden lg:block lg:w-2/5 overflow-y-auto">
                    <Skeleton className="m-4 h-8 w-40" />
                    <div className="flex flex-col space-y-4 p-4">
                        <Skeleton className="w-full h-24" />
                        <Skeleton className="w-full h-24" />
                        <Skeleton className="w-full h-24" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full flex flex-col lg:flex-row overflow-auto h-screen">
                {/* Left section (full width on mobile, 60% on desktop) */}
                <div className="w-full lg:w-3/5 px-4 py-4">
                    <div className="flex justify-center items-center h-[60vh]">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">Error</h2>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
                {/* Right section (hidden on mobile, 40% on desktop) */}
                <div className="hidden lg:block lg:w-2/5 overflow-y-auto">
                    {/* Empty for now */}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-screen flex flex-col overflow-hidden">
            {/* Category header - fixed at the top */}
            <header className="flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Video Rendering</h1>
                </div>
            </header>

            {/* Main content area - flex column on mobile/tab, flex row on desktop */}
            <div className="flex flex-col lg:flex-row w-full overflow-y-auto flex-grow scrollbar-hide dark:bg-neutral-950">
                {/* Left section (video and details) */}
                <div className="w-full lg:w-3/5 lg:px-10 lg:py-8 md:px-4 md:py-4">
                    {/* Video Player Section */}
                    <div className="mb-6 rounded-lg overflow-hidden aspect-video relative">
                        {isAuthenticated ? (
                            <video
                                ref={videoRef}
                                src={video?.videoFile}
                                poster={video?.thumbnail}
                                controls
                                className="w-full h-full"
                            />
                        ) : (
                            <div className="relative w-full h-full">
                                <img
                                    src={video?.thumbnail || '/placeholder.jpg'}
                                    alt={video?.title || 'Video thumbnail'}
                                    className="w-full h-full layout-fill object-cover"
                                />
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 md:p-8">
                                    <h3 className="text-xl md:text-2xl font-bold mb-4">Sign in to watch this video</h3>
                                    <p className="text-center mb-4">
                                        You need to be logged in to view this content
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Video Title */}
                    <h1 className="text-xl md:text-2xl font-bold mb-4">{video?.title}</h1>

                    {/* Channel Info & Action Buttons */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 md:h-12 md:w-12">
                                {channel?.avatar && (
                                    <img
                                        src={channel.avatar || "/api/placeholder/128/128"}
                                        alt={channel.username}
                                        className="w-full h-full rounded-full border-2 border-gray-950 dark:border-white shadow-md object-cover"
                                    />
                                )}
                            </Avatar>
                            <div>
                                <h3 className="font-semibold">{channel?.fullName || channel?.username}</h3>
                                <p className="text-sm text-gray-500">
                                    {channel?.subscribersCount.toLocaleString()} subscribers
                                </p>
                            </div>
                            {isAuthenticated && channel && (
                                <button
                                    onClick={handleSubscriptionToggle}
                                    disabled={subscribing}
                                    className={`
                                        ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium transition-colors duration-200
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
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant={isLiked ? "default" : "outline"}
                                className={`flex items-center gap-2 ${isLiked ? "bg-neutral-900 hover:bg-neutral-800" : ""}`}
                                onClick={handleLikeToggle}
                                disabled={!isAuthenticated}
                                size="sm"
                            >
                                <ThumbsUp
                                    className={isLiked ? "fill-current text-white" : ""}
                                    size={16}
                                />
                                <span className={isLiked ? "text-white" : ""}>{likesCount}</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={handleDownload}
                                disabled={!isAuthenticated}
                                size="sm"
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">Download</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={handlePlaylistDialogOpen}
                                disabled={!isAuthenticated}
                                size="sm"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                <span className="hidden sm:inline">Save</span>
                            </Button>
                        </div>
                    </div>

                    {/* Video Details Accordion */}
                    <Accordion type="single" collapsible className="mb-8">
                        <AccordionItem value="details">
                            <AccordionTrigger className="py-3 md:py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Eye size={16} />
                                        <span>{formatViews(Number(video?.views))} views</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        <span>{formatDate(video?.createdAt || '')}</span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="py-3 md:py-4">
                                <div className="whitespace-pre-line text-sm md:text-base">{video?.description}</div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Comments Section */}
                    <div className="border-t pt-6 pb-8">
                        <h3 className="text-lg md:text-xl font-bold mb-4">Comments</h3>
                        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
                                <CommentSection videoId={videoid} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right section (desktop view) - remains hidden on mobile/tablet */}
                <div className="hidden lg:block lg:w-2/5 overflow-y-auto pb-8 border-l pl-4 pr-4 scrollbar-hide">
                    <div className="py-6 px-6">
                        <h3 className="text-lg font-bold mb-4">More from {channel?.fullName || channel?.username}</h3>

                        {loadingRecommended ? (
                            <div className="space-y-4">
                                <Skeleton className="w-full h-24" />
                                <Skeleton className="w-full h-24" />
                                <Skeleton className="w-full h-24" />
                            </div>
                        ) : recommendedVideos.length > 0 ? (
                            <div className="space-y-4">
                                {recommendedVideos.map((video) => (
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
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500">No other videos from this channel</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile and tablet recommended videos section (appears below main content) */}
                <div className="lg:hidden w-full px-4 py-6 border-t">
                    <h3 className="text-lg font-bold mb-4">More from {channel?.fullName || channel?.username}</h3>

                    {loadingRecommended ? (
                        <div className="space-y-4">
                            <Skeleton className="w-full h-24" />
                            <Skeleton className="w-full h-24" />
                            <Skeleton className="w-full h-24" />
                        </div>
                    ) : recommendedVideos.length > 0 ? (
                        <div className="space-y-4">
                            {recommendedVideos.map((video) => (
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
                    ) : (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No other videos from this channel</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Playlist Dialog */}
            <AlertDialog open={isPlaylistDialogOpen} onOpenChange={(open) => dispatch({ type: 'SET_PLAYLIST_DIALOG_OPEN', payload: open })}>
                <AlertDialogContent className="sm:max-w-md max-w-[80vw]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Save to Playlist</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Select a playlist to add this video to your collection
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="my-6">
                        {loadingPlaylists ? (
                            <div className="space-y-3 py-2">
                                <Skeleton className="h-14 w-full rounded-md" />
                                <Skeleton className="h-14 w-full rounded-md" />
                                <Skeleton className="h-14 w-full rounded-md" />
                            </div>
                        ) : playlists.length > 0 ? (
                            <div className="max-h-[280px] overflow-y-auto space-y-2.5">
                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist._id}
                                        onClick={() => !savingToPlaylist && addVideoToPlaylist(playlist._id)}
                                        className="p-3.5 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 
                                      transition-colors duration-150 cursor-pointer flex justify-between items-center
                                      group shadow-sm hover:shadow-md gap-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="text-gray-500 dark:text-gray-400"
                                                >
                                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                    <polyline points="7 3 7 8 15 8"></polyline>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium">{playlist.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full 
                                          bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 
                                          transition-colors duration-150">
                                            {savingToPlaylist ? (
                                                <div className="w-4 h-4 border-2 border-gray-500 border-r-transparent rounded-full animate-spin" />
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="text-gray-600 dark:text-gray-300"
                                                >
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gray-100 dark:bg-gray-700">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-gray-500 dark:text-gray-400"
                                    >
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">No playlists found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Create a playlist first to save videos</p>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                        <AlertDialogCancel
                            disabled={savingToPlaylist}
                            className="mt-3 sm:mt-0 border border-gray-300 dark:border-gray-700"
                        >
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
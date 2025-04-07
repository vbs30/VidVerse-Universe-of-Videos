'use client'

import React, { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Loader2, Play, Edit, X } from "lucide-react";
import Link from "next/link";
import VideoGallery from "@/components/VideoGallery";

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

interface Playlist {
    _id: string;
    name: string;
    description: string;
    owner: string;
    createdAt: string;
    updatedAt: string;
    video_details: Video[];
    videoCount: number;
}

interface PlaylistResponse {
    statusCode: number;
    data: Playlist[];
    message: string;
    success: boolean;
}

const PlaylistSection: React.FC = () => {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Format view count
    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    // Format date for videos and playlists
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

    // Fetch user playlists
    const fetchPlaylists = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/v1/playlist/get-user-playlist', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("Failed to fetch playlists");
            }

            const result: PlaylistResponse = await response.json();

            if (result.success) {
                setPlaylists(result.data);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Fetch playlist details
    const fetchPlaylistDetails = async (playlistId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8000/api/v1/playlist/p/${playlistId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("Failed to fetch playlist details");
            }

            const result = await response.json();

            if (result.success && result.data.length > 0) {
                setSelectedPlaylist(result.data[0]);
            } else {
                throw new Error(result.message || "No playlist found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Create new playlist
    const createPlaylist = async () => {
        try {
            setIsSubmitting(true);
            const response = await fetch('http://localhost:8000/api/v1/playlist/create-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    userId: user?._id
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create playlist");
            }

            const result = await response.json();

            if (result.success) {
                setFormData({ name: '', description: '' });
                setShowCreateForm(false);
                fetchPlaylists();
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update playlist
    const updatePlaylist = async () => {
        if (!selectedPlaylist) return;

        try {
            setIsSubmitting(true);
            const response = await fetch(`http://localhost:8000/api/v1/playlist/p/${selectedPlaylist._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update playlist");
            }

            const result = await response.json();

            if (result.success) {
                setFormData({ name: '', description: '' });
                setShowEditForm(false);
                fetchPlaylists();
                if (selectedPlaylist) {
                    fetchPlaylistDetails(selectedPlaylist._id);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete playlist
    const deletePlaylist = async (playlistId: string) => {
        try {
            setIsSubmitting(true);
            const response = await fetch(`http://localhost:8000/api/v1/playlist/p/${playlistId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("Failed to delete playlist");
            }

            const result = await response.json();

            if (result.success) {
                setSelectedPlaylist(null);
                fetchPlaylists();
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Remove video from playlist
    const removeVideoFromPlaylist = async (videoId: string, playlistId: string) => {
        try {
            setIsSubmitting(true);
            const response = await fetch(`http://localhost:8000/api/v1/playlist/remove/${videoId}/${playlistId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const result = await response.json();

            if (result.success) {
                // Update the selected playlist by filtering out the removed video
                if (selectedPlaylist) {
                    setSelectedPlaylist({
                        ...selectedPlaylist,
                        video_details: selectedPlaylist.video_details.filter(video => video._id !== videoId),
                        videoCount: selectedPlaylist.videoCount - 1
                    });

                    // Also update the playlists array to reflect the change
                    setPlaylists(playlists.map(playlist =>
                        playlist._id === playlistId
                            ? {
                                ...playlist,
                                videoCount: playlist.videoCount - 1,
                                // Update video_details if they exist in the playlist object
                                video_details: playlist.video_details ?
                                    playlist.video_details.filter(video => video._id !== videoId) :
                                    []
                            }
                            : playlist
                    ));
                }
            } else {
                throw new Error(result.message || "Failed to remove video from playlist");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
            // Consider showing a toast notification here instead of setting the error state
            console.error("Error removing video:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit button click
    const handleEditClick = (playlist: Playlist) => {
        setFormData({
            name: playlist.name,
            description: playlist.description
        });
        setShowEditForm(true);
    };

    // Load playlists on component mount
    useEffect(() => {
        fetchPlaylists();
    }, []);

    if (loading && playlists.length === 0) {
        return (
            <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading playlists...</p>
            </div>
        );
    }

    if (error && playlists.length === 0) {
        return (
            <div className="py-16 text-center">
                <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-4 rounded-lg max-w-md mx-auto">
                    <p>{error}</p>
                </div>
                <button
                    onClick={fetchPlaylists}
                    className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto pb-16">
            {/* Main content area with playlist list and details */}
            <div className="flex flex-col">
                {/* Header with Create Playlist button */}
                <div className="flex justify-between items-center mb-6">
                    {selectedPlaylist ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedPlaylist(null)}
                                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                                Back to playlists
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlaylist.name}</h2>
                        </div>
                    ) : (
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Playlists</h2>
                    )}

                    {!selectedPlaylist && !showCreateForm && (
                        <Button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Playlist
                        </Button>
                    )}
                </div>

                {/* Create Playlist Form */}
                {showCreateForm && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Playlist</h3>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Playlist Name*
                                </label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter playlist name"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Add a description"
                                    rows={3}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateForm(false)}
                                    className="mr-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={createPlaylist}
                                    disabled={isSubmitting || !formData.name.trim()}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Playlist"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Playlist Form */}
                {showEditForm && selectedPlaylist && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Playlist</h3>
                            <button
                                onClick={() => setShowEditForm(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Playlist Name*
                                </label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter playlist name"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Add a description"
                                    rows={3}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEditForm(false)}
                                    className="mr-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={updatePlaylist}
                                    disabled={isSubmitting || !formData.name.trim()}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Playlist"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display Playlists or Selected Playlist Details */}
                {!selectedPlaylist ? (
                    // Playlists List
                    <>
                        {playlists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist._id}
                                        className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                                    >
                                        <div
                                            className="relative h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer"
                                            onClick={() => fetchPlaylistDetails(playlist._id)}
                                        >
                                            {playlist.video_details && playlist.video_details.length > 0 ? (
                                                <>
                                                    <img
                                                        src={playlist.video_details[0].thumbnail}
                                                        alt={playlist.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-30 transition-opacity">
                                                        <Play className="h-12 w-12 text-white opacity-90" />
                                                    </div>
                                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded">
                                                        {playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                    </svg>
                                                    <span className="mt-2">No videos</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3
                                                        className="font-medium text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                                                        onClick={() => fetchPlaylistDetails(playlist._id)}
                                                    >
                                                        {playlist.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Updated {getTimeAgo(playlist.updatedAt)}
                                                    </p>
                                                </div>

                                                <div className="flex">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
                                                            </AlertDialogHeader>
                                                            <p className="text-gray-600 dark:text-gray-400">
                                                                This will permanently delete "{playlist.name}" playlist. This action cannot be undone.
                                                            </p>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deletePlaylist(playlist._id)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">No playlists</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    You haven't created any playlists yet.
                                </p>
                                <Button
                                    onClick={() => setShowCreateForm(true)}
                                    className="mt-6 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Create a playlist
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    // Selected Playlist Details
                    <div>
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedPlaylist.videoCount} {selectedPlaylist.videoCount === 1 ? 'video' : 'videos'} • Updated {getTimeAgo(selectedPlaylist.updatedAt)}
                                </p>

                                {selectedPlaylist.description && (
                                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                                        {selectedPlaylist.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(selectedPlaylist)}
                                    className="flex items-center gap-1"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 border-red-200 hover:border-red-300 dark:border-red-900 dark:hover:border-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            This will permanently delete "{selectedPlaylist.name}" playlist. This action cannot be undone.
                                        </p>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => deletePlaylist(selectedPlaylist._id)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>

                        {/* Videos in Playlist */}
                        {selectedPlaylist.video_details.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {selectedPlaylist.video_details.map((video) => (
                                    <div key={video._id} className="relative group">
                                        <Link href={`/videos/${video._id}`}>
                                            <VideoGallery
                                                title={video.title}
                                                channelName={video.ownerName}
                                                views={`${formatViews(Number(video.views))} views`}
                                                timeAgo={getTimeAgo(video.createdAt)}
                                                duration={video.duration}
                                                thumbnailUrl={video.thumbnail}
                                            />
                                        </Link>

                                        {/* Remove from playlist button */}
                                        <button
                                            onClick={() => removeVideoFromPlaylist(video._id, selectedPlaylist._id)}
                                            className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove from playlist"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">This playlist has no videos</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    Add videos to this playlist while watching them by clicking the "Save" button.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistSection;
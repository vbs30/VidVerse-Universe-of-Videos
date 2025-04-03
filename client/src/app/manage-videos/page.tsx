'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';

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
}

const ManageVideos = () => {
    const { user, isAuthenticated } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        videoFile: null as File | null,
        thumbnail: null as File | null,
    });
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

    // Fetch user videos on component mount
    useEffect(() => {
        const fetchUserVideos = async () => {
            if (!isAuthenticated || !user) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000/api/v1/videos/cv/${user.username}`, {
                    credentials: 'include',
                });

                const data = await response.json();

                if (data.success) {
                    setVideos(data.data.videos || []);
                } else {
                    toast.error('Failed to fetch videos');
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
                toast.error('Error connecting to server');
            } finally {
                setLoading(false);
            }
        };

        fetchUserVideos();
    }, [isAuthenticated, user]);

    // Handle input changes for edit form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    // Handle file input changes
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const { name } = e.target;
            setEditData(prev => ({ ...prev, [name]: e.target.files?.[0] || null }));
        }
    };

    // Enable edit mode for a video
    const enableEditMode = (video: Video, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation(); // Stop event propagation

        setEditMode(video._id);
        setEditData({
            title: video.title,
            description: video.description,
            videoFile: null,
            thumbnail: null,
        });

        // Clear any previous progress
        setUploadProgress(0);
    };

    // Cancel edit mode
    const cancelEdit = () => {
        setEditMode(null);
        setEditData({
            title: '',
            description: '',
            videoFile: null,
            thumbnail: null,
        });
        setUploadProgress(0);
    };

    // Handle video update with XMLHttpRequest for progress tracking
    const handleUpdateVideo = (videoId: string) => {
        if (!isAuthenticated) return;

        const formData = new FormData();

        // Only append fields that have values
        if (editData.title) formData.append('title', editData.title);
        if (editData.description) formData.append('description', editData.description);
        if (editData.videoFile) formData.append('videoFile', editData.videoFile);
        if (editData.thumbnail) formData.append('thumbnail', editData.thumbnail);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // Update the video in the local state
                        setVideos(videos.map(video =>
                            video._id === videoId ? response.data : video
                        ));
                        toast.success('Video updated successfully');
                        setEditMode(null);
                    } else {
                        toast.error(response.message || 'Failed to update video');
                    }
                } catch (error) {
                    toast.error('Error processing server response');
                }
            } else {
                toast.error(`Server error: ${xhr.status}`);
            }
            setIsUploading(false);
        });

        xhr.addEventListener('error', () => {
            toast.error('Network error occurred');
            setIsUploading(false);
        });

        xhr.addEventListener('abort', () => {
            toast.error('Upload aborted');
            setIsUploading(false);
        });

        xhr.open('PATCH', `http://localhost:8000/api/v1/videos/v/${videoId}`);
        xhr.withCredentials = true;
        setIsUploading(true);
        xhr.send(formData);
    };

    // Open delete confirmation dialog
    const confirmDeleteVideo = (videoId: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation(); // Stop event propagation

        setVideoToDelete(videoId);
        setShowDeleteDialog(true);
    };

    // Handle video deletion
    const handleDeleteVideo = async () => {
        if (!isAuthenticated || !videoToDelete) return;

        try {
            const response = await fetch(`http://localhost:8000/api/v1/videos/v/${videoToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                // Remove the video from local state
                setVideos(videos.filter(video => video._id !== videoToDelete));
                toast.success('Video deleted successfully');
            } else {
                toast.error(data.message || 'Failed to delete video');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            toast.error('Error connecting to server');
        } finally {
            setShowDeleteDialog(false);
            setVideoToDelete(null);
        }
    };

    // Common layout for auth/loading states
    const renderCenteredMessage = (title: string, message: string, actionButton?: React.ReactNode) => (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                {actionButton}
            </div>
        </div>
    );

    if (!isAuthenticated) {
        return renderCenteredMessage(
            "Sign In Required",
            "You need to be signed in to manage your videos."
        );
    }

    if (loading) {
        return renderCenteredMessage(
            "Loading Your Videos",
            "Please wait while we fetch your videos..."
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
            {/* Fixed header */}
            <header className="sticky top-0 flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-black px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Manage your videos</h1>
                </div>
            </header>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                <div className="container mx-auto">
                    {videos.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-8">
                            <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't uploaded any videos yet.</p>
                            <button
                                onClick={() => window.location.href = '/create-videos'}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                Upload Your First Video
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {videos.map(video => (
                                <div key={video._id} className="border rounded-lg overflow-hidden px-4 py-4 bg-white dark:bg-neutral-800 shadow dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row">
                                        <Link href={`/videos/${video._id}`} className="relative w-full sm:w-1/3 h-48">
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                                {video.duration}
                                            </div>
                                        </Link>

                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <Link href={`/videos/${video._id}`}>
                                                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                                        {video.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                                                    {video.description}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{video.views} views</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                <button
                                                    onClick={(e) => enableEditMode(video, e)}
                                                    className="bg-blue-600 dark:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-200 text-sm sm:text-base"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => confirmDeleteVideo(video._id, e)}
                                                    className="bg-red-600 dark:bg-red-700 text-white px-3 sm:px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 transition duration-200 text-sm sm:text-base"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* High-quality Edit Modal with excellent responsive design */}
            <AlertDialog open={editMode !== null} onOpenChange={(open) => !open && cancelEdit()}>
                <AlertDialogContent className="max-w-md sm:max-w-lg md:max-w-xl p-0 rounded-xl overflow-hidden border-0 shadow-lg dark:bg-neutral-800">
                    {/* Header with visual styling */}
                    <div className="bg-gradient-to-r text-neutral-800 dark:text-white p-5">
                        <AlertDialogTitle className="text-xl md:text-2xl font-bold">
                            Edit Video
                        </AlertDialogTitle>
                    </div>

                    {/* Clean form layout */}
                    <div className="bg-white dark:bg-neutral-800 p-5 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-hide">
                        <div>
                            <label
                                htmlFor="edit-title"
                                className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
                            >
                                Title
                            </label>
                            <input
                                id="edit-title"
                                name="title"
                                type="text"
                                value={editData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Enter video title"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="edit-description"
                                className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
                            >
                                Description
                            </label>
                            <textarea
                                id="edit-description"
                                name="description"
                                rows={4}
                                value={editData.description}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Describe your video"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="edit-video"
                                className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
                            >
                                Video File (optional)
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label
                                            htmlFor="edit-video"
                                            className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="edit-video"
                                                name="videoFile"
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="video/*"
                                                className="sr-only"
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        MP4, WebM, or Ogg up to 2GB
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="edit-thumbnail"
                                className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
                            >
                                Thumbnail (optional)
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label
                                            htmlFor="edit-thumbnail"
                                            className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                                        >
                                            <span>Upload a thumbnail</span>
                                            <input
                                                id="edit-thumbnail"
                                                name="thumbnail"
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="sr-only"
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isUploading && (
                            <div className="space-y-2 bg-blue-50 dark:bg-neutral-900/20 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="font-medium text-blue-700 dark:text-blue-300">Uploading...</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2 w-full bg-blue-200 dark:bg-blue-800" />
                            </div>
                        )}
                    </div>

                    {/* Footer with attractive buttons */}
                    <div className="bg-gray-50 dark:bg-neutral-800 px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <AlertDialogCancel
                            onClick={cancelEdit}
                            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            disabled={isUploading}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => editMode && handleUpdateVideo(editMode)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Save Changes'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your video.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVideo}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ManageVideos;
'use client'

import React, { useReducer, useEffect } from 'react';
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

// Define the state type
interface State {
    videos: Video[];
    loading: boolean;
    editMode: string | null;
    editData: {
        title: string;
        description: string;
        videoFile: File | null;
        thumbnail: File | null;
    };
    uploadProgress: number;
    isUploading: boolean;
    showDeleteDialog: boolean;
    videoToDelete: string | null;
}

// Define action types
type Action =
    | { type: 'SET_VIDEOS'; payload: Video[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_EDIT_MODE'; payload: string | null }
    | { type: 'SET_EDIT_DATA'; payload: Partial<State['editData']> }
    | { type: 'RESET_EDIT_DATA' }
    | { type: 'SET_UPLOAD_PROGRESS'; payload: number }
    | { type: 'SET_IS_UPLOADING'; payload: boolean }
    | { type: 'SET_DELETE_DIALOG'; payload: boolean }
    | { type: 'SET_VIDEO_TO_DELETE'; payload: string | null }
    | { type: 'DELETE_VIDEO'; payload: string }
    | { type: 'UPDATE_VIDEO'; payload: Video };

// Initial state
const initialState: State = {
    videos: [],
    loading: true,
    editMode: null,
    editData: {
        title: '',
        description: '',
        videoFile: null,
        thumbnail: null,
    },
    uploadProgress: 0,
    isUploading: false,
    showDeleteDialog: false,
    videoToDelete: null,
};

// Reducer function
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_VIDEOS':
            return { ...state, videos: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_EDIT_MODE':
            return { ...state, editMode: action.payload };
        case 'SET_EDIT_DATA':
            return {
                ...state,
                editData: { ...state.editData, ...action.payload },
            };
        case 'RESET_EDIT_DATA':
            return {
                ...state,
                editData: initialState.editData,
                uploadProgress: 0,
            };
        case 'SET_UPLOAD_PROGRESS':
            return { ...state, uploadProgress: action.payload };
        case 'SET_IS_UPLOADING':
            return { ...state, isUploading: action.payload };
        case 'SET_DELETE_DIALOG':
            return { ...state, showDeleteDialog: action.payload };
        case 'SET_VIDEO_TO_DELETE':
            return { ...state, videoToDelete: action.payload };
        case 'DELETE_VIDEO':
            return {
                ...state,
                videos: state.videos.filter(video => video._id !== action.payload),
            };
        case 'UPDATE_VIDEO':
            return {
                ...state,
                videos: state.videos.map(video =>
                    video._id === action.payload._id ? action.payload : video
                ),
            };
        default:
            return state;
    }
}

const ManageVideos = () => {
    const { user, isAuthenticated } = useAuth();
    const [state, dispatch] = useReducer(reducer, initialState);

    // Fetch user videos on component mount
    useEffect(() => {
        const fetchUserVideos = async () => {
            if (!isAuthenticated || !user) {
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/cv/${user.username}`, {
                    credentials: 'include',
                });

                const data = await response.json();

                if (data.success) {
                    dispatch({ type: 'SET_VIDEOS', payload: data.data.videos || [] });
                } else {
                    toast.error('Failed to fetch videos');
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
                toast.error('Error connecting to server');
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        fetchUserVideos();
    }, [isAuthenticated, user]);

    // Handle input changes for edit form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        dispatch({ type: 'SET_EDIT_DATA', payload: { [name]: value } });
    };

    // Handle file input changes
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const { name } = e.target;
            dispatch({ type: 'SET_EDIT_DATA', payload: { [name]: e.target.files[0] } });
        }
    };

    // Enable edit mode for a video
    const enableEditMode = (video: Video, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation(); // Stop event propagation

        dispatch({ type: 'SET_EDIT_MODE', payload: video._id });
        dispatch({
            type: 'SET_EDIT_DATA',
            payload: {
                title: video.title,
                description: video.description,
                videoFile: null,
                thumbnail: null,
            },
        });
        dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: 0 });
    };

    // Cancel edit mode
    const cancelEdit = () => {
        dispatch({ type: 'SET_EDIT_MODE', payload: null });
        dispatch({ type: 'RESET_EDIT_DATA' });
    };

    // Handle video update with XMLHttpRequest for progress tracking
    const handleUpdateVideo = (videoId: string) => {
        if (!isAuthenticated) return;

        const formData = new FormData();

        const { title, description, videoFile, thumbnail } = state.editData;

        // Only append fields that have values
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);
        if (videoFile) formData.append('videoFile', videoFile);
        if (thumbnail) formData.append('thumbnail', thumbnail);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: percentComplete });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // Update the video in the local state
                        dispatch({ type: 'UPDATE_VIDEO', payload: response.data });
                        toast.success('Video updated successfully');
                        dispatch({ type: 'SET_EDIT_MODE', payload: null });
                    } else {
                        toast.error(response.message || 'Failed to update video');
                    }
                } catch (error) {
                    toast.error('Error processing server response:' + error);
                }
            } else {
                toast.error(`Server error: ${xhr.status}`);
            }
            dispatch({ type: 'SET_IS_UPLOADING', payload: false });
        });

        xhr.addEventListener('error', () => {
            toast.error('Network error occurred');
            dispatch({ type: 'SET_IS_UPLOADING', payload: false });
        });

        xhr.addEventListener('abort', () => {
            toast.error('Upload aborted');
            dispatch({ type: 'SET_IS_UPLOADING', payload: false });
        });

        xhr.open('PATCH', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/v/${videoId}`);
        xhr.withCredentials = true;
        dispatch({ type: 'SET_IS_UPLOADING', payload: true });
        xhr.send(formData);
    };

    // Open delete confirmation dialog
    const confirmDeleteVideo = (videoId: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation(); // Stop event propagation

        dispatch({ type: 'SET_VIDEO_TO_DELETE', payload: videoId });
        dispatch({ type: 'SET_DELETE_DIALOG', payload: true });
    };

    // Format view count
    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    // Handle video deletion
    const handleDeleteVideo = async () => {
        if (!isAuthenticated || !state.videoToDelete) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/v/${state.videoToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                // Remove the video from local state
                dispatch({ type: 'DELETE_VIDEO', payload: state.videoToDelete });
                toast.success('Video deleted successfully');
            } else {
                toast.error(data.message || 'Failed to delete video');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            toast.error('Error connecting to server');
        } finally {
            dispatch({ type: 'SET_DELETE_DIALOG', payload: false });
            dispatch({ type: 'SET_VIDEO_TO_DELETE', payload: null });
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

    if (state.loading) {
        return renderCenteredMessage(
            "Loading Your Videos",
            "Please wait while we fetch your videos..."
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-950">
            {/* Fixed header */}
            <header className="sticky top-0 flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Manage your videos</h1>
                </div>
            </header>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                <div className="container mx-auto">
                    {state.videos.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-8">
                            <p className="text-gray-600 dark:text-gray-300 mb-4">You haven&apos;t uploaded any videos yet.</p>
                            <button
                                onClick={() => window.location.href = '/create-videos'}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                Upload Your First Video
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {state.videos.map(video => (
                                <div key={video._id} className="border rounded-lg overflow-hidden px-4 py-4 bg-white dark:bg-neutral-800 shadow dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row">
                                        <Link href={`/videos/${video._id}`} className="relative w-full sm:w-1/3 h-48">
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-2 right-2 bg-neutral-950 bg-opacity-70 text-white text-xs px-2 py-1 rounded">
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
                                                    <span>{formatViews(Number(video.views))} views</span>
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
            <AlertDialog open={state.editMode !== null} onOpenChange={(open) => !open && cancelEdit()}>
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
                                value={state.editData.title}
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
                                value={state.editData.description}
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

                        {state.isUploading && (
                            <div className="space-y-2 bg-blue-50 dark:bg-neutral-900/20 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="font-medium text-blue-700 dark:text-blue-300">Uploading...</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{state.uploadProgress}%</span>
                                </div>
                                <Progress value={state.uploadProgress} className="h-2 w-full bg-blue-200 dark:bg-blue-800" />
                            </div>
                        )}
                    </div>

                    {/* Footer with attractive buttons */}
                    <div className="bg-gray-50 dark:bg-neutral-800 px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <AlertDialogCancel
                            onClick={cancelEdit}
                            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            disabled={state.isUploading}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => state.editMode && handleUpdateVideo(state.editMode)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors"
                            disabled={state.isUploading}
                        >
                            {state.isUploading ? 'Uploading...' : 'Save Changes'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={state.showDeleteDialog} onOpenChange={(open) =>
                dispatch({ type: 'SET_DELETE_DIALOG', payload: open })
            }>
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
'use client'

import React, { useReducer, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

// Define the state type
type State = {
    title: string;
    description: string;
    videoFile: File | null;
    thumbnailFile: File | null;
    videoPreview: string;
    thumbnailPreview: string;
    loading: boolean;
    error: string;
    success: boolean;
    uploadProgress: number;
    authLoading: boolean;
};

// Define the action types
type Action =
    | { type: 'SET_TITLE'; payload: string }
    | { type: 'SET_DESCRIPTION'; payload: string }
    | { type: 'SET_VIDEO_FILE'; payload: File }
    | { type: 'SET_THUMBNAIL_FILE'; payload: File }
    | { type: 'REMOVE_VIDEO' }
    | { type: 'REMOVE_THUMBNAIL' }
    | { type: 'START_UPLOAD' }
    | { type: 'UPDATE_PROGRESS'; payload: number }
    | { type: 'UPLOAD_SUCCESS' }
    | { type: 'UPLOAD_ERROR'; payload: string }
    | { type: 'RESET_FORM' }
    | { type: 'SET_AUTH_LOADING'; payload: boolean };

// Initial state
const initialState: State = {
    title: '',
    description: '',
    videoFile: null,
    thumbnailFile: null,
    videoPreview: '',
    thumbnailPreview: '',
    loading: false,
    error: '',
    success: false,
    uploadProgress: 0,
    authLoading: true,
};

// Reducer function
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_TITLE':
            return { ...state, title: action.payload };
        case 'SET_DESCRIPTION':
            return { ...state, description: action.payload };
        case 'SET_VIDEO_FILE':
            return {
                ...state,
                videoFile: action.payload,
                videoPreview: URL.createObjectURL(action.payload),
                error: '',
            };
        case 'SET_THUMBNAIL_FILE':
            return {
                ...state,
                thumbnailFile: action.payload,
                thumbnailPreview: URL.createObjectURL(action.payload),
                error: '',
            };
        case 'REMOVE_VIDEO':
            return {
                ...state,
                videoFile: null,
                videoPreview: '',
            };
        case 'REMOVE_THUMBNAIL':
            return {
                ...state,
                thumbnailFile: null,
                thumbnailPreview: '',
            };
        case 'START_UPLOAD':
            return {
                ...state,
                loading: true,
                error: '',
                uploadProgress: 0,
            };
        case 'UPDATE_PROGRESS':
            return {
                ...state,
                uploadProgress: action.payload,
            };
        case 'UPLOAD_SUCCESS':
            return {
                ...state,
                loading: false,
                success: true,
                title: '',
                description: '',
                videoFile: null,
                thumbnailFile: null,
                videoPreview: '',
                thumbnailPreview: '',
            };
        case 'UPLOAD_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case 'RESET_FORM':
            return {
                ...initialState,
                authLoading: false,
            };
        case 'SET_AUTH_LOADING':
            return {
                ...state,
                authLoading: action.payload,
            };
        default:
            return state;
    }
}

export default function CreateVideo() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [state, dispatch] = useReducer(reducer, initialState);

    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Check authentication status
    useEffect(() => {
        // Short timeout to ensure auth context is fully loaded
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        }, 500);
        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('video/')) {
                dispatch({ type: 'SET_VIDEO_FILE', payload: file });
            } else {
                dispatch({ type: 'UPLOAD_ERROR', payload: 'Please select a valid video file' });
            }
        }
    };

    const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                dispatch({ type: 'SET_THUMBNAIL_FILE', payload: file });
            } else {
                dispatch({ type: 'UPLOAD_ERROR', payload: 'Please select a valid image file for thumbnail' });
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!state.videoFile || !state.thumbnailFile || !state.title.trim()) {
            dispatch({
                type: 'UPLOAD_ERROR',
                payload: 'Please provide all required fields: video, thumbnail, and title'
            });
            return;
        }

        dispatch({ type: 'START_UPLOAD' });

        try {
            const formData = new FormData();
            formData.append('videoFile', state.videoFile);
            formData.append('thumbnail', state.thumbnailFile);
            formData.append('title', state.title);
            formData.append('description', state.description);

            // Use XMLHttpRequest instead of fetch to track upload progress
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    dispatch({ type: 'UPDATE_PROGRESS', payload: percentComplete });
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        dispatch({ type: 'UPLOAD_SUCCESS' });

                        // Redirect to video page after short delay
                        setTimeout(() => {
                            router.push(`/videos/${response.data._id}`);
                        }, 2000);
                    } else {
                        dispatch({
                            type: 'UPLOAD_ERROR',
                            payload: response.message || 'Failed to upload video'
                        });
                    }
                } else {
                    dispatch({ type: 'UPLOAD_ERROR', payload: 'Server error: ' + xhr.status });
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                dispatch({ type: 'UPLOAD_ERROR', payload: 'Network error occurred while uploading' });
            });

            xhr.addEventListener('abort', () => {
                dispatch({ type: 'UPLOAD_ERROR', payload: 'Upload aborted' });
            });

            // Open and send the request
            xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/create-video`, true);
            xhr.withCredentials = true;
            xhr.send(formData);

        } catch (err) {
            dispatch({
                type: 'UPLOAD_ERROR',
                payload: 'An error occurred while uploading. Please try again.'
            });
            console.error('Upload error:', err);
        }
    };

    const removeVideo = () => {
        dispatch({ type: 'REMOVE_VIDEO' });
        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
    };

    const removeThumbnail = () => {
        dispatch({ type: 'REMOVE_THUMBNAIL' });
        if (thumbnailInputRef.current) {
            thumbnailInputRef.current.value = '';
        }
    };

    // Loading state
    if (state.authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading the page...</p>
            </div>
        </div>
    );

    // Error state
    if (state.error && !state.videoFile && !state.thumbnailFile) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <div className="text-center bg-white dark:bg-black p-8 rounded-lg shadow-lg max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{state.error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                >
                    Refresh
                </button>
            </div>
        </div>
    );

    // Authentication check
    if (!isAuthenticated || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-800">
            <div className="text-center bg-white dark:bg-black p-8 rounded-lg shadow-lg max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Required</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Please log in to view your channel.</p>
                <button
                    onClick={() => window.location.href = '/login'}
                    className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                >
                    Log In
                </button>
            </div>
        </div>
    );

    // Loading state with progress bar
    if (state.loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <div className="flex flex-col items-center w-full max-w-md px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Uploading video... {state.uploadProgress}%</p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                    <div
                        className="bg-red-600 h-4 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${state.uploadProgress}%` }}
                    ></div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">Please do not close this window</p>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col overflow-hidden">
            {/* Category header - fixed at the top */}
            <header className="sticky top-0 flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Upload New Video</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Share your creativity with the world</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 shadow rounded-lg overflow-hidden">
                        {state.success && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <p className="text-green-700 dark:text-green-300">Video uploaded successfully! Redirecting...</p>
                            </div>
                        )}

                        {state.error && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                <p className="text-red-700 dark:text-red-300">{state.error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Video Upload */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Video <span className="text-red-500">*</span>
                                    </label>
                                    {!state.videoPreview ? (
                                        <div
                                            onClick={() => videoInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    MP4, WebM, or MOV up to 500MB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden bg-black">
                                            <video
                                                src={state.videoPreview}
                                                className="w-full h-48 object-contain"
                                                controls
                                            />
                                            <button
                                                type="button"
                                                onClick={removeVideo}
                                                className="absolute top-2 right-2 bg-gray-900/70 p-1 rounded-full hover:bg-red-600 transition-colors"
                                                aria-label="Remove video"
                                            >
                                                <X className="h-5 w-5 text-white" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        onChange={handleVideoChange}
                                        className="hidden"
                                        accept="video/*"
                                    />
                                </div>

                                {/* Thumbnail Upload */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Thumbnail <span className="text-red-500">*</span>
                                    </label>
                                    {!state.thumbnailPreview ? (
                                        <div
                                            onClick={() => thumbnailInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <Camera className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Upload a thumbnail image
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    JPG, PNG or GIF (16:9 recommended)
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden">
                                            <img
                                                src={state.thumbnailPreview}
                                                alt="Thumbnail preview"
                                                className="w-full h-48 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeThumbnail}
                                                className="absolute top-2 right-2 bg-gray-900/70 p-1 rounded-full hover:bg-red-600 transition-colors"
                                                aria-label="Remove thumbnail"
                                            >
                                                <X className="h-5 w-5 text-white" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={thumbnailInputRef}
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={state.title}
                                    onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-2 border-dashed border-gray-300 dark:border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white dark:placeholder-gray-400 text-base py-3 px-4"
                                    placeholder="Enter video title"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={state.description}
                                    onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })}
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-2 border-dashed border-gray-300 dark:border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white dark:placeholder-gray-400 text-base py-3 px-4"
                                    placeholder="Describe your video"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={state.loading}
                                    className={`inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white ${state.loading
                                            ? 'bg-indigo-400 dark:bg-indigo-600 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                                >
                                    {state.loading ? 'Uploading...' : 'Upload Video'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        By uploading, you agree to our Terms of Service and Community Guidelines
                    </p>
                </div>
            </div>
        </div>
    );
}
'use client'

import React, { useReducer, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MoreVertical, Trash2, Edit, Send, ChevronUp, ChevronDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface UserProfile {
    _id: string;
    username: string;
    fullName?: string;
    avatar?: string;
    coverImage?: string;
}

interface Comment {
    _id: string;
    content: string;
    video: string;
    owner: string | {
        _id: string;
        username: string;
        fullName?: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
    ownerDetails?: UserProfile;
    likeCount?: number;
    isLiked?: boolean;
}

interface CommentSectionProps {
    videoId: string;
}

// Define state type
interface CommentState {
    comments: Comment[];
    commentContent: string;
    loading: boolean;
    error: string | null;
    editingCommentId: string | null;
    editContent: string;
    expandedMenuId: string | null;
    showAllComments: boolean;
    commentCount: number;
    likeStates: { [key: string]: boolean };
    likeCounts: { [key: string]: number };
    isLiking: { [key: string]: boolean };
}

// Define action types
type Action =
    | { type: 'SET_COMMENTS', payload: Comment[] }
    | { type: 'SET_COMMENT_CONTENT', payload: string }
    | { type: 'SET_LOADING', payload: boolean }
    | { type: 'SET_ERROR', payload: string | null }
    | { type: 'SET_EDITING_COMMENT', payload: { id: string | null, content: string } }
    | { type: 'TOGGLE_MENU', payload: string }
    | { type: 'TOGGLE_SHOW_COMMENTS' }
    | { type: 'SET_COMMENT_COUNT', payload: number }
    | { type: 'UPDATE_LIKE_STATE', payload: { commentId: string, isLiked: boolean } }
    | { type: 'UPDATE_LIKE_COUNT', payload: { commentId: string, count: number } }
    | { type: 'SET_IS_LIKING', payload: { commentId: string, isLiking: boolean } }
    | { type: 'DELETE_COMMENT', payload: string }
    | { type: 'RESET_EDIT_STATE' };

// Define reducer function
const commentReducer = (state: CommentState, action: Action): CommentState => {
    switch (action.type) {
        case 'SET_COMMENTS':
            return { ...state, comments: action.payload };
        case 'SET_COMMENT_CONTENT':
            return { ...state, commentContent: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_EDITING_COMMENT':
            return {
                ...state,
                editingCommentId: action.payload.id,
                editContent: action.payload.content
            };
        case 'TOGGLE_MENU':
            return {
                ...state,
                expandedMenuId: state.expandedMenuId === action.payload ? null : action.payload
            };
        case 'TOGGLE_SHOW_COMMENTS':
            return { ...state, showAllComments: !state.showAllComments };
        case 'SET_COMMENT_COUNT':
            return { ...state, commentCount: action.payload };
        case 'UPDATE_LIKE_STATE':
            return {
                ...state,
                likeStates: {
                    ...state.likeStates,
                    [action.payload.commentId]: action.payload.isLiked
                }
            };
        case 'UPDATE_LIKE_COUNT':
            return {
                ...state,
                likeCounts: {
                    ...state.likeCounts,
                    [action.payload.commentId]: action.payload.count
                }
            };
        case 'SET_IS_LIKING':
            return {
                ...state,
                isLiking: {
                    ...state.isLiking,
                    [action.payload.commentId]: action.payload.isLiking
                }
            };
        case 'DELETE_COMMENT':
            return {
                ...state,
                comments: state.comments.filter(comment => comment._id !== action.payload),
                commentCount: state.commentCount - 1
            };
        case 'RESET_EDIT_STATE':
            return { ...state, editingCommentId: null, editContent: '' };
        default:
            return state;
    }
};

const CommentSection: React.FC<CommentSectionProps> = ({ videoId }) => {
    const { user, isAuthenticated } = useAuth();
    const initialState: CommentState = {
        comments: [],
        commentContent: '',
        loading: true,
        error: null,
        editingCommentId: null,
        editContent: '',
        expandedMenuId: null,
        showAllComments: true,
        commentCount: 0,
        likeStates: {},
        likeCounts: {},
        isLiking: {}
    };

    const [state, dispatch] = useReducer(commentReducer, initialState);
    const menuRef = useRef<HTMLDivElement>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch comments when component mounts or videoId changes or when authentication status changes
    useEffect(() => {
        if (videoId) {
            fetchComments();
        }

        // Add click outside handler for dropdown menu
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                dispatch({ type: 'SET_EDITING_COMMENT', payload: { id: null, content: '' } });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [videoId, isAuthenticated]); // Added isAuthenticated as dependency

    // Focus on textarea when editing starts
    useEffect(() => {
        if (state.editingCommentId && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [state.editingCommentId]);

    // Fetch user profile data
    const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/get-user-profile/${userId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();

            if (data.success) {
                return data.data;
            }
            return null;
        } catch (err) {
            console.error('Error fetching user profile:', err);
            return null;
        }
    };

    // Check if user has liked a comment
    const checkCommentLikeStatus = async (commentId: string) => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/likes/check-comment-likes/${commentId}`, {
                credentials: 'include', // Important to include credentials
                cache: 'no-store', // Prevent caching to always get fresh data
                headers: {
                    'Cache-Control': 'no-cache' // Additional cache control
                }
            });

            if (!response.ok) {
                throw new Error('Failed to check like status');
            }

            const data = await response.json();
            return data.success && data.data ? data.data.isLiked : false;
        } catch (err) {
            console.error('Error checking comment like status:', err);
            return false;
        }
    };

    // Get comment like count
    const getCommentLikeCount = async (commentId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/likes/countComment/${commentId}`, {
                cache: 'no-store', // Prevent caching
                headers: {
                    'Cache-Control': 'no-cache' // Additional cache control
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get like count');
            }

            const data = await response.json();
            return data.success && data.data ? data.data.count : 0;
        } catch (err) {
            console.error('Error getting comment like count:', err);
            return 0;
        }
    };

    // Fetch comments from API and enrich with user profile data
    const fetchComments = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/comments/c/${videoId}`, {
                cache: 'no-store', // Prevent caching
                headers: {
                    'Cache-Control': 'no-cache' // Additional cache control
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }

            const data = await response.json();

            if (data.success) {
                const commentsData = data.data;
                const newLikeStates: { [key: string]: boolean } = {};
                const newLikeCounts: { [key: string]: number } = {};

                const enrichedComments = await Promise.all(
                    commentsData.map(async (comment: Comment) => {
                        // If owner is a string (just the ID), fetch user details
                        const updatedComment = { ...comment };

                        if (typeof comment.owner === 'string') {
                            const userProfile = await fetchUserProfile(comment.owner);
                            if (userProfile) {
                                updatedComment.ownerDetails = userProfile;
                            }
                        }

                        // Get like count for the comment
                        const likeCount = await getCommentLikeCount(comment._id);
                        updatedComment.likeCount = likeCount;
                        newLikeCounts[comment._id] = likeCount;

                        // Check if authenticated user has liked the comment
                        if (isAuthenticated) {
                            const isLiked = await checkCommentLikeStatus(comment._id);
                            updatedComment.isLiked = isLiked;
                            newLikeStates[comment._id] = isLiked;
                        }

                        return updatedComment;
                    })
                );

                dispatch({ type: 'SET_COMMENTS', payload: enrichedComments });
                dispatch({ type: 'SET_COMMENT_COUNT', payload: enrichedComments.length });

                // Update like states and counts
                Object.entries(newLikeStates).forEach(([commentId, isLiked]) => {
                    dispatch({
                        type: 'UPDATE_LIKE_STATE',
                        payload: { commentId, isLiked }
                    });
                });

                Object.entries(newLikeCounts).forEach(([commentId, count]) => {
                    dispatch({
                        type: 'UPDATE_LIKE_COUNT',
                        payload: { commentId, count }
                    });
                });
            } else {
                dispatch({ type: 'SET_COMMENTS', payload: [] });
                dispatch({ type: 'SET_COMMENT_COUNT', payload: 0 });
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            dispatch({
                type: 'SET_ERROR',
                payload: err instanceof Error ? err.message : 'An unknown error occurred'
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Handle comment submission
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error('Please log in to comment');
            return;
        }

        if (!state.commentContent.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/comments/c/${videoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ content: state.commentContent.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Comment added successfully');
                dispatch({ type: 'SET_COMMENT_CONTENT', payload: '' });
                fetchComments(); // Refresh comments
            } else {
                toast.error(data.message || 'Failed to add comment');
            }
        } catch (err) {
            console.error('Error adding comment:', err);
            toast.error('Failed to add comment. Please try again.');
        }
    };

    // Handle comment update
    const handleUpdateComment = async (commentId: string) => {
        if (!state.editContent.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/comments/u/${commentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ content: state.editContent.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Comment updated successfully');
                dispatch({ type: 'RESET_EDIT_STATE' });
                fetchComments(); // Refresh comments
            } else {
                toast.error(data.message || 'Failed to update comment');
            }
        } catch (err) {
            console.error('Error updating comment:', err);
            toast.error('Failed to update comment. Please try again.');
        }
    };

    // Handle comment deletion
    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/comments/u/${commentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Comment deleted successfully');
                dispatch({ type: 'DELETE_COMMENT', payload: commentId });
            } else {
                toast.error(data.message || 'Failed to delete comment');
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            toast.error('Failed to delete comment. Please try again.');
        }
    };

    // Handle like/unlike comment with forced update
    const handleToggleLike = async (commentId: string) => {
        if (!isAuthenticated) {
            toast.error('Please log in to like comments');
            return;
        }

        // If already processing a like action for this comment, return
        if (state.isLiking[commentId]) return;

        // Set up optimistic UI update
        const currentLiked = state.likeStates[commentId] || false;
        const currentCount = state.likeCounts[commentId] || 0;

        // Update local state immediately (optimistic update)
        dispatch({
            type: 'UPDATE_LIKE_STATE',
            payload: { commentId, isLiked: !currentLiked }
        });

        dispatch({
            type: 'UPDATE_LIKE_COUNT',
            payload: {
                commentId,
                count: !currentLiked ? currentCount + 1 : Math.max(currentCount - 1, 0)
            }
        });

        // Mark this comment as being processed
        dispatch({
            type: 'SET_IS_LIKING',
            payload: { commentId, isLiking: true }
        });

        try {
            // Use no-cache to prevent any caching issues
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/likes/toggle/c/${commentId}`, {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Instead of relying on the optimistic update, verify the actual state
                // This ensures we have the correct state from the server
                const verifiedLikeStatus = await checkCommentLikeStatus(commentId);
                const verifiedLikeCount = await getCommentLikeCount(commentId);

                dispatch({
                    type: 'UPDATE_LIKE_STATE',
                    payload: { commentId, isLiked: verifiedLikeStatus }
                });

                dispatch({
                    type: 'UPDATE_LIKE_COUNT',
                    payload: { commentId, count: verifiedLikeCount }
                });
            } else {
                // Revert the optimistic update if the API call fails
                dispatch({
                    type: 'UPDATE_LIKE_STATE',
                    payload: { commentId, isLiked: currentLiked }
                });

                dispatch({
                    type: 'UPDATE_LIKE_COUNT',
                    payload: { commentId, count: currentCount }
                });

                toast.error(data.message || 'Failed to update like status');
            }
        } catch (err) {
            console.error('Error toggling like:', err);

            // Revert the optimistic update if there's an error
            dispatch({
                type: 'UPDATE_LIKE_STATE',
                payload: { commentId, isLiked: currentLiked }
            });

            dispatch({
                type: 'UPDATE_LIKE_COUNT',
                payload: { commentId, count: currentCount }
            });

            toast.error('Failed to update like status. Please try again.');
        } finally {
            // Mark this comment as no longer being processed
            dispatch({
                type: 'SET_IS_LIKING',
                payload: { commentId, isLiking: false }
            });
        }
    };

    // Format date for display
    const formatCommentDate = (dateString: string): string => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (err) {
            console.log(err)
            return 'Unknown date'
        }
    };

    // Handle starting edit mode
    const startEditing = (commentId: string, content: string) => {
        dispatch({
            type: 'SET_EDITING_COMMENT',
            payload: { id: commentId, content }
        });
        dispatch({ type: 'TOGGLE_MENU', payload: '' }); // Close menu
    };

    // Toggle comment dropdown menu
    const toggleMenu = (commentId: string) => {
        dispatch({ type: 'TOGGLE_MENU', payload: commentId });
    };

    // Auto-resize textarea as content grows
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        dispatch({ type: 'SET_COMMENT_CONTENT', payload: textarea.value });

        // Reset height first
        textarea.style.height = 'auto';
        // Set new height
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Helper function to get comment owner info
    const getCommentOwnerInfo = (comment: Comment) => {
        // If we have fetched owner details, use that
        if (comment.ownerDetails) {
            return {
                _id: comment.ownerDetails._id,
                username: comment.ownerDetails.username,
                fullName: comment.ownerDetails.fullName || comment.ownerDetails.username,
                avatar: comment.ownerDetails.avatar
            };
        }

        // If owner is an object with the needed fields
        if (typeof comment.owner === 'object' && comment.owner !== null) {
            return {
                _id: comment.owner._id,
                username: comment.owner.username,
                fullName: comment.owner.fullName || comment.owner.username,
                avatar: comment.owner.avatar
            };
        }

        // Fallback for string owner (shouldn't happen with the enhanced fetching)
        return {
            _id: typeof comment.owner === 'string' ? comment.owner : 'unknown',
            username: 'User',
            fullName: 'User',
            avatar: undefined
        };
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-4">
            {/* Comments Header */}
            <div className="mb-6 border-b dark:border-gray-700 pb-4">
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_SHOW_COMMENTS' })}
                    className="flex items-center gap-2 font-medium text-lg text-gray-900 dark:text-white"
                >
                    {state.commentCount} Comments
                    {state.showAllComments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {/* Comment Input */}
            {isAuthenticated && state.showAllComments && (
                <div className="mb-8">
                    <form onSubmit={handleSubmitComment} className="flex flex-col">
                        <div className="flex gap-3 mb-2">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-300 dark:bg-neutral-800 overflow-hidden">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-red-600 text-white text-lg font-bold">
                                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <textarea
                                    value={state.commentContent}
                                    onChange={handleTextareaChange}
                                    placeholder="Add a comment..."
                                    className="w-full min-h-[40px] bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-red-600 dark:focus:border-red-600 outline-none resize-none px-2 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    rows={1}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'SET_COMMENT_CONTENT', payload: '' })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!state.commentContent.trim()}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2
                  ${state.commentContent.trim()
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                            >
                                Comment <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Comments List */}
            {state.showAllComments && (
                <div className="space-y-6">
                    {state.loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                        </div>
                    ) : state.error ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">{state.error}</p>
                            <button
                                onClick={fetchComments}
                                className="mt-2 text-red-600 hover:text-red-700 dark:hover:text-red-500 font-medium"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : state.comments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white">No comments yet</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Be the first to share your thoughts on this video.
                            </p>
                        </div>
                    ) : (
                        state.comments.map((comment) => {
                            const ownerInfo = getCommentOwnerInfo(comment);
                            const isCommentLiked = state.likeStates[comment._id] !== undefined
                                ? state.likeStates[comment._id]
                                : comment.isLiked || false;
                            const commentLikeCount = state.likeCounts[comment._id] !== undefined
                                ? state.likeCounts[comment._id]
                                : comment.likeCount || 0;

                            return (
                                <div key={comment._id} className="flex gap-3 group">
                                    {/* User Avatar - Link to channel */}
                                    <Link href={`/channel/${ownerInfo._id}`} className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden hover:opacity-90 transition-opacity">
                                        {ownerInfo.avatar ? (
                                            <img
                                                src={ownerInfo.avatar}
                                                alt={ownerInfo.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-red-600 text-white text-lg font-bold">
                                                {ownerInfo.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </Link>

                                    {/* Comment Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/channel/${ownerInfo.username}`}
                                                        className="font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                                    >
                                                        {ownerInfo.fullName}
                                                    </Link>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatCommentDate(comment.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Edit/Delete Menu - Only visible for own comments */}
                                            {isAuthenticated && user?._id === ownerInfo._id && (
                                                <div className="relative" ref={menuRef}>
                                                    <button
                                                        onClick={() => toggleMenu(comment._id)}
                                                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {state.expandedMenuId === comment._id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-900 shadow-lg rounded-md py-1 z-10 border border-gray-200 dark:border-gray-700">
                                                            <button
                                                                onClick={() => startEditing(comment._id, comment.content)}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                                            >
                                                                <Edit size={16} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(comment._id)}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={16} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Mode */}
                                        {state.editingCommentId === comment._id ? (
                                            <div className="mt-1">
                                                <textarea
                                                    ref={commentInputRef}
                                                    value={state.editContent}
                                                    onChange={(e) => dispatch({ type: 'SET_EDITING_COMMENT', payload: { id: comment._id, content: e.target.value } })}
                                                    className="w-full min-h-[60px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-red-600 dark:focus:border-red-600"
                                                    rows={2}
                                                />

                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={() => dispatch({ type: 'RESET_EDIT_STATE' })}
                                                        className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateComment(comment._id)}
                                                        className="px-3 py-1 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                                    {comment.content}
                                                </p>

                                                {/* Like button and count - Updated to use likeStates */}
                                                <div className="mt-2 flex items-center">
                                                    <button
                                                        onClick={() => handleToggleLike(comment._id)}
                                                        disabled={state.isLiking[comment._id]}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isCommentLiked
                                                                ? 'text-neutral-800 dark:text-white'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            } transition-colors ${state.isLiking[comment._id] ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                    >
                                                        <ThumbsUp
                                                            size={16}
                                                            className={isCommentLiked ? 'fill-neutral-800 dark:fill-white' : 'fill-white dark:fill-neutral-800'}
                                                        />
                                                        <span>{commentLikeCount}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Login prompt if not authenticated */}
            {!isAuthenticated && state.showAllComments && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                        <p className="text-gray-700 dark:text-gray-300">
                            <a href="/login" className="text-red-600 hover:text-red-700 font-medium">
                                Sign in
                            </a> to add your comment on this video.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
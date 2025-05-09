'use client'

import React, { useReducer, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchComponentProps {
  className?: string;
  isDarkTheme: boolean;
  isMobile?: boolean;
}

// Types for search suggestions
interface VideoSuggestion {
  _id: string;
  title: string;
  type: 'video';
}

interface ChannelSuggestion {
  _id: string;
  username: string;
  type: 'channel';
}

type Suggestion = VideoSuggestion | ChannelSuggestion;

// API response types
interface VideoData {
  _id: string;
  title: string;
  description?: string;
  ownerName?: string;
}

interface ChannelData {
  _id: string;
  username: string;
  fullName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
}

// Define state type for useReducer
interface SearchState {
  searchQuery: string;
  isSearchOpen: boolean;
  suggestions: Suggestion[];
  isLoading: boolean;
  showSuggestions: boolean;
}

// Define action types
type SearchAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_SEARCH'; payload?: boolean }
  | { type: 'SET_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_SUGGESTIONS'; payload: boolean }
  | { type: 'CLEAR_SEARCH' };

// Reducer function
const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'TOGGLE_SEARCH':
      return { ...state, isSearchOpen: action.payload !== undefined ? action.payload : !state.isSearchOpen };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SHOW_SUGGESTIONS':
      return { ...state, showSuggestions: action.payload };
    case 'CLEAR_SEARCH':
      return { ...state, searchQuery: '', suggestions: [] };
    default:
      return state;
  }
};

export function SearchComponent({ className, isDarkTheme, isMobile = false }: SearchComponentProps) {
  // Initial state for the reducer
  const initialState: SearchState = {
    searchQuery: '',
    isSearchOpen: false,
    suggestions: [],
    isLoading: false,
    showSuggestions: false,
  };

  const [state, dispatch] = useReducer(searchReducer, initialState);
  const { searchQuery, isSearchOpen, suggestions, isLoading, showSuggestions } = state;

  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle search query changes and fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Fetch videos
        const videosResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/all-videos`);
        const videosData = await videosResponse.json() as ApiResponse<VideoData>;

        // Fetch channels
        const channelsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscription/all-channels`);
        const channelsData = await channelsResponse.json() as ApiResponse<ChannelData>;

        if (videosData.success && channelsData.success) {
          // Filter videos by query
          const filteredVideos = videosData.data
            .filter((video: VideoData) =>
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              video.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 3) // Limit to 3 videos
            .map((video: VideoData) => ({
              _id: video._id,
              title: video.title,
              type: 'video' as const
            }));

          // Filter channels by query
          const filteredChannels = channelsData.data
            .filter((channel: ChannelData) =>
              channel.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              channel.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 2) // Limit to 2 channels
            .map((channel: ChannelData) => ({
              _id: channel._id,
              username: channel.username,
              type: 'channel' as const
            }));

          // Combine and set suggestions
          dispatch({ type: 'SET_SUGGESTIONS', payload: [...filteredVideos, ...filteredChannels] });
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Use debounce to avoid excessive API calls
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        dispatch({ type: 'TOGGLE_SEARCH', payload: false });
        dispatch({ type: 'SHOW_SUGGESTIONS', payload: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      dispatch({ type: 'TOGGLE_SEARCH', payload: false });
      dispatch({ type: 'SHOW_SUGGESTIONS', payload: false });
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'video') {
      router.push(`/videos/${suggestion._id}`);
    } else {
      router.push(`/channel/${suggestion.username}`);
    }
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SHOW_SUGGESTIONS', payload: false });
    dispatch({ type: 'TOGGLE_SEARCH', payload: false });
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  // Render suggestions list
  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <div className={`absolute z-50 mt-1 w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto ${isMobile ? 'top-12 right-0' : 'top-10'}`}>
        {isLoading ? (
          <div className="p-3 text-sm text-center text-gray-500">Loading suggestions...</div>
        ) : (
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.type}-${index}`}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center justify-between"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center">
                  <Search size={16} className="mr-2 text-gray-500" />
                  {suggestion.type === 'video' ? (
                    <span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">Video:</span> {suggestion.title}
                    </span>
                  ) : (
                    <span>
                      <span className="text-green-600 dark:text-green-400 font-medium">Channel:</span> {suggestion.username}
                    </span>
                  )}
                </div>
              </li>
            ))}
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-t text-center"
              onClick={handleSearch}
            >
              <span className="text-blue-600 dark:text-blue-400">See all results for &quot;{searchQuery}&quot;</span>
            </li>
          </ul>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="relative" ref={searchRef}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SEARCH' })}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Search size={20} />
        </button>

        {isSearchOpen && (
          <div
            className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2 w-60"
          >
            <form onSubmit={handleSearch}>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search videos and channels..."
                  className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-black dark:text-white outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
                    dispatch({ type: 'SHOW_SUGGESTIONS', payload: true });
                  }}
                  onFocus={() => dispatch({ type: 'SHOW_SUGGESTIONS', payload: true })}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-12 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>
            {renderSuggestions()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto" ref={searchRef}>
      <form onSubmit={handleSearch} className={`flex items-center w-full px-2 rounded-lg border ${isDarkTheme ? 'border-gray-700 bg-neutral-900' : 'border-gray-300 bg-gray-100'} ${className}`}>
        <input
          type="text"
          placeholder="Search videos and channels..."
          className={`w-full p-2 outline-none ${isDarkTheme ? 'bg-neutral-900 placeholder-gray-500 text-white' : 'bg-gray-100 placeholder-gray-500 text-black'}`}
          value={searchQuery}
          onChange={(e) => {
            dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
            dispatch({ type: 'SHOW_SUGGESTIONS', payload: true });
          }}
          onFocus={() => dispatch({ type: 'SHOW_SUGGESTIONS', payload: true })}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        )}
        <button type="submit" className="mx-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <Search size={18} />
        </button>
      </form>
      {renderSuggestions()}
    </div>
  );
}
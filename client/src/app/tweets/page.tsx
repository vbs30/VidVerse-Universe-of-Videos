'use client'

import React from 'react';

const TweetsPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-neutral-900 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-4">Page Under Construction</h1>
        
        <div className="mb-6">
          <svg 
            className="w-16 h-16 mx-auto text-neutral-800 dark:text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M19 14v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m3-4V4a2 2 0 012-2h4a2 2 0 012 2v6m-5 4v2m6-2v2"
            />
          </svg>
        </div>
        
        <p className="text-lg text-neutral-800 dark:text-white mb-4">
          This page is currently in development and hasn't been built yet.
        </p>
        
        <p className="text-neutral-800 dark:text-white">
          Please check back later for updates. We're working hard to get this ready for you soon!
        </p>

      </div>
    </div>
  );
};

export default TweetsPage;
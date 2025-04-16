import React from 'react';
import { Github, Linkedin, Mail, Code, Database, Server, Globe, BookOpen, Award } from 'lucide-react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const AboutPage = () => {
    return (
        <div className="flex flex-col h-screen bg-white dark:bg-neutral-950 text-gray-800 dark:text-gray-100">
            {/* Category header - fixed at the top */}
            <header className="sticky top-0 flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Creator Section</h1>
                </div>
            </header>

            {/* Content Section - Added flex-1 to allow scrolling */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="container mx-auto pb-8">
                    {/* Introduction Section - Adjusted for better mobile display */}
                    <div className="mt-8 flex flex-col lg:flex-row items-center px-4 lg:px-10">
                        {/* Text Content - Made responsive and text-justify */}
                        <div className="w-full">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-lg leading-relaxed text-justify">
                                    Hi! I'm Vinayak Suryavanshi, a Full Stack Developer skilled in Data Structures and Algorithms with Java,
                                    Full Stack Web Development (ReactJS, NodeJS, MySQL, MongoDB), Machine Learning with Python, and Docker.
                                </p>
                            </div>
                        </div>

                        {/* Image Section - Responsive sizing */}
                        <div className="w-full flex justify-center mt-6 lg:mt-0">
                            <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 dark:border-gray-700">
                                <img
                                    src="https://res.cloudinary.com/dasjbuz66/image/upload/v1744717100/profile_iifhd3.png"
                                    alt="Vinayak Suryavanshi"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Connect Section */}
                    <div className="mt-12 px-4 lg:px-10">
                        <h2 className="text-xl font-bold mb-4">Connect With Me</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <a
                                href="mailto:vbs02002@gmail.com"
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Mail className="text-blue-600 dark:text-blue-400" size={20} />
                                <span className="text-gray-800 dark:text-gray-200">vbs02002@gmail.com</span>
                            </a>

                            <a
                                href="https://github.com/vbs30"
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="text-gray-800 dark:text-gray-200" size={20} />
                                <span className="text-gray-800 dark:text-gray-200">GitHub</span>
                            </a>

                            <a
                                href="https://www.linkedin.com/in/vinayak-suryavanshi/"
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Linkedin className="text-blue-600 dark:text-blue-400" size={20} />
                                <span className="text-gray-800 dark:text-gray-200">LinkedIn</span>
                            </a>

                            <a
                                href="https://x.com/Vbs_30"
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 dark:text-gray-200">
                                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                </svg>
                                <span className="text-gray-800 dark:text-gray-200">Twitter</span>
                            </a>

                            <a
                                href="https://portfolio-webiste-build.vercel.app/"
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Globe className="text-green-600 dark:text-green-400" size={20} />
                                <span className="text-gray-800 dark:text-gray-200">Portfolio</span>
                            </a>

                            <a
                                href="https://leetcode.com/u/VBS_30/"
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 dark:text-yellow-400">
                                    <path d="M16 8l2-2m-2 2L9 15l-2-2m9-5h5v5M7 21h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
                                </svg>
                                <span className="text-gray-800 dark:text-gray-200">LeetCode</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Edit,
  Film,
  Users,
  Eye,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  Clock,
  ThumbsUp,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types
interface UserChannel {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage: string;
  createdAt: string;
  subscribersCount: number;
  channelSubscriptionCount: number;
  isSubscribed: boolean;
}

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFile: string;
  duration: string;
  views: number;
  createdAt: string;
}

interface VideoStats {
  totalVideos: number;
  totalViews: number;
  videos: Video[];
}

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [channelData, setChannelData] = useState<UserChannel | null>(null);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  // Add this state to manage the active tab
  const [activeTab, setActiveTab] = useState("overview");

  // Content distribution data calculated from actual video data
  const getContentCategories = (videos: Video[]) => {
    // Simple categorization based on title keywords
    const categories = {
      Vlogs: 0,
      Music: 0,
      Tutorial: 0,
      Other: 0
    };

    videos?.forEach(video => {
      const title = video.title.toLowerCase();
      if (title.includes('vlog')) {
        categories.Vlogs++;
      } else if (title.includes('song') || title.includes('music') || title.includes('theme')) {
        categories.Music++;
      } else if (title.includes('tutorial') || title.includes('how to')) {
        categories.Tutorial++;
      } else {
        categories.Other++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated && user?.username) {
        try {
          // Fetch channel data
          const channelResponse = await fetch(`http://localhost:8000/api/v1/users/c/${user.username}`, {
            credentials: 'include',
          });
          const channelResult = await channelResponse.json();

          if (channelResult.success) {
            setChannelData(channelResult.data);
          }

          // Fetch video stats
          const videosResponse = await fetch(`http://localhost:8000/api/v1/videos/cv/${user.username}`, {
            credentials: 'include',
          });
          const videosResult = await videosResponse.json();

          if (videosResult.success) {
            // Calculate total views
            const totalViews = videosResult.data.videos.reduce(
              (sum: number, video: Video) => sum + video.views, 0
            );

            setVideoStats({
              totalVideos: videosResult.data.totalVideos,
              totalViews: totalViews,
              videos: videosResult.data.videos
            });
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium dark:text-gray-200">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-neutral-950">
        <div className="text-center max-w-md p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Not Logged In</h1>
          <p className="mb-6 dark:text-gray-300">Please log in to view your profile dashboard.</p>
          <Link href="/login">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Generate content distribution data from actual videos
  const contentDistributionData = videoStats?.videos ?
    getContentCategories(videoStats.videos) :
    [{ name: 'No Data', value: 1 }];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Generate view data based on the actual videos by month
  const getViewsByMonth = () => {
    if (!videoStats?.videos) return [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyViews = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (6 - i));
      return {
        month: monthNames[date.getMonth()],
        views: 0
      };
    });

    // Count views by month
    videoStats.videos.forEach(video => {
      const videoDate = new Date(video.createdAt);
      const monthIndex = monthlyViews.findIndex(item => item.month === monthNames[videoDate.getMonth()]);
      if (monthIndex >= 0) {
        monthlyViews[monthIndex].views += video.views;
      }
    });

    return monthlyViews;
  };

  const viewsData = getViewsByMonth();

  return (
    // Set the main container to flex column with full height
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
      {/* Category header - fixed at the top */}
      <header className="flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-neutral-950 px-4 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold pl-2 text-black dark:text-white">My Profile</h1>
        </div>
      </header>

      {/* Profile header section - also fixed height */}
      <div className="shrink-0 dark:bg-neutral-950 border-b dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-neutral-700"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.fullName}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mr-6">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {new Date(channelData?.createdAt || user.createdAt).toLocaleDateString()}
              </span>
              <Link href="/settings">
                <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - also fixed */}
      <div className="shrink-0 bg-white dark:bg-neutral-950 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 p-1 rounded-lg">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Scrollable Content Area - this will take remaining space and scroll */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-neutral-950">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <Film className="h-5 w-5 mr-2 text-blue-500" />
                      Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{videoStats?.totalVideos || 0}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total content created</p>
                  </CardContent>
                </Card>

                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <Users className="h-5 w-5 mr-2 text-green-500" />
                      Subscribers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{channelData?.subscribersCount || 0}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Channel followers</p>
                  </CardContent>
                </Card>

                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <Eye className="h-5 w-5 mr-2 text-purple-500" />
                      Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{videoStats?.totalViews || 0}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total content views</p>
                  </CardContent>
                </Card>

                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <Award className="h-5 w-5 mr-2 text-yellow-500" />
                      Avg. Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {videoStats && videoStats.totalVideos > 0
                        ? Math.round(videoStats.totalViews / videoStats.totalVideos)
                        : 0}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Per video</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Views Over Time</CardTitle>
                    <CardDescription className="dark:text-gray-400">Last 7 months performance</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={viewsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: 'none' }} />
                        <Legend />
                        <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Content Distribution</CardTitle>
                    <CardDescription className="dark:text-gray-400">Video categories breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contentDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {contentDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Channel Statistics */}
              <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Channel Progress
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">Track your channel growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscriber Goal</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {channelData?.subscribersCount || 0}/1000
                        </span>
                      </div>
                      <Progress
                        value={channelData ? Math.min(100, (channelData.subscribersCount / 1000) * 100) : 0}
                        className="h-2 bg-gray-200 dark:bg-neutral-700"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video Upload Goal</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {videoStats?.totalVideos || 0}/10
                        </span>
                      </div>
                      <Progress
                        value={videoStats ? Math.min(100, (videoStats.totalVideos / 10) * 100) : 0}
                        className="h-2 bg-gray-200 dark:bg-neutral-700"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Views Goal</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {videoStats?.totalViews || 0}/1000
                        </span>
                      </div>
                      <Progress
                        value={videoStats ? Math.min(100, (videoStats.totalViews / 1000) * 100) : 0}
                        className="h-2 bg-gray-200 dark:bg-neutral-700"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === "engagement" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <ThumbsUp className="h-5 w-5 mr-2 text-blue-500" />
                      Engagement Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">4.8%</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Average interaction per view</p>
                  </CardContent>
                </Card>

                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <Share2 className="h-5 w-5 mr-2 text-green-500" />
                      Average Watch Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">2:45</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Minutes per view</p>
                  </CardContent>
                </Card>

                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gray-700 dark:text-gray-200">
                      <Users className="h-5 w-5 mr-2 text-purple-500" />
                      Subscriber Ratio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {videoStats && videoStats.totalViews > 0
                        ? `${((channelData?.subscribersCount || 0) / videoStats.totalViews * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Subscribers per 100 views</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Growth Opportunities</CardTitle>
                  <CardDescription className="dark:text-gray-400">Ways to increase engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex-shrink-0 mr-3 bg-green-100 dark:bg-green-800 p-2 rounded-full">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-400">Post Consistently</h4>
                        <p className="text-sm text-green-700 dark:text-green-500">Regular uploads help build audience loyalty</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex-shrink-0 mr-3 bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-400">Engage With Comments</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-500">Respond to viewer comments to build community</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex-shrink-0 mr-3 bg-purple-100 dark:bg-purple-800 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-800 dark:text-purple-400">Optimize Thumbnails</h4>
                        <p className="text-sm text-purple-700 dark:text-purple-500">Eye-catching thumbnails increase click-through rates</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
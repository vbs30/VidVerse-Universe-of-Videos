'use client'

import React from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Home,
  History,
  Users,
  PlusCircle,
  Edit,
  Video,
  UserIcon,
  Settings,
  LogIn,
  UserPlus,
  ThumbsUp,
  BadgeInfo 
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

import { LoginBox } from './LoginBox';
import { SignUpBox } from './SignupBox';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkTheme = theme === 'dark';

  const guestMenuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "About us",
      url: "/about",
      icon: BadgeInfo,
    },
  ];

  const userMenuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "History",
      url: "/history",
      icon: History,
    },
    {
      title: "Subscriptions",
      url: "/subscriptions",
      icon: Users,
    },
    {
      title: "Liked Videos",
      url: "/liked-videos",
      icon: ThumbsUp,
    },
    {
      title: "About us",
      url: "/about",
      icon: BadgeInfo,
    },
  ];

  const userChannelItems = [
    {
      title: "My Channel",
      url: "/my-channel",
      icon: Video,
    },
    {
      title: "Create Video",
      url: "/create-video",
      icon: PlusCircle,
    },
    {
      title: "Manage Videos",
      url: "/manage-videos",
      icon: Edit,
    }
  ];

  const myProfileItems = [
    {
      title: "My Profile",
      url: "/profile",
      icon: UserIcon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const renderGuestContent = () => (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {guestMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="mr-2" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Get Started</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col space-y-2 p-2">
              <LoginBox
                className={`w-full flex items-center justify-center py-2 px-4 rounded-md ${isDarkTheme
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
              >
                <LogIn size={16} className="mr-2" /> Login
              </LoginBox>
              <SignUpBox
                className={`w-full flex items-center justify-center py-2 px-4 rounded-md ${isDarkTheme
                  ? 'bg-purple-700 text-white hover:bg-purple-600'
                  : 'bg-purple-200 text-black hover:bg-purple-300'
                  }`}
              >
                <UserPlus size={16} className="mr-2" /> Sign Up
              </SignUpBox>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  const renderUserContent = () => (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="mr-2" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Channel Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userChannelItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="mr-2" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Profile</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex items-center p-2 space-x-3 mb-2">
              <img
                src={user?.avatar}
                alt={user?.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <SidebarMenu>
              {myProfileItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="mr-2" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  return user ? renderUserContent() : renderGuestContent();
}

export default Dashboard;
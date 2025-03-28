'use client'

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Home,
  Video,
  History,
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Twitter,
  LogIn,
  UserPlus
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

interface User {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  email: string;
}

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    // Fetch current user
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/users/get-current-user', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      }
    };

    fetchCurrentUser();
  }, []);

  const guestMenuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Tweets Corner",
      url: "/tweets",
      icon: Twitter,
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
      title: "Tweets Corner",
      url: "/tweets",
      icon: Twitter,
    },
  ];

  const userChannelItems = [
    {
      title: "My Channel",
      url: "/channel",
      icon: Video,
    },
    {
      title: "Create Video",
      url: "/channel/create",
      icon: PlusCircle,
    },
    {
      title: "Manage Videos",
      url: "/channel/manage",
      icon: Edit,
    }
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
            <div className="flex items-center p-2 space-x-3">
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  return user ? renderUserContent() : renderGuestContent();
}

export default Dashboard;
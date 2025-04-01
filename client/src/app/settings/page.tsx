'use client'

import React, { useState } from 'react'
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
    UserCircle2,
    LockKeyhole,
    ImageIcon,
    Upload,
    Settings as SettingsIcon
} from 'lucide-react'

const SettingsPage: React.FC = () => {
    const { user } = useAuth()

    // Password Change State
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Avatar and Cover Image States
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null)

    // Password Change Handler
    const handlePasswordChange = async () => {
        // Validate inputs
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        try {
            const response = await fetch('http://localhost:8000/api/v1/users/change-password', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                    confirmPassword
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Password changed successfully')
                // Reset password fields
                setOldPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error(data.message || 'Failed to change password')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    // Avatar Update Handler
    const handleAvatarUpdate = async () => {
        if (!avatarFile) {
            toast.error('Please select an avatar file')
            return
        }

        // File size check (5MB = 5 * 1024 * 1024 bytes)
        if (avatarFile.size > 5 * 1024 * 1024) {
            toast.error('Avatar file must be less than 5MB')
            return
        }

        const formData = new FormData()
        formData.append('avatar', avatarFile)

        try {
            const response = await fetch('http://localhost:8000/api/v1/users/update-avatar', {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Avatar updated successfully')
                setAvatarFile(null)
            } else {
                toast.error(data.message || 'Failed to update avatar')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    // Cover Image Update Handler
    const handleCoverImageUpdate = async () => {
        if (!coverImageFile) {
            toast.error('Please select a cover image file')
            return
        }

        // File size check (5MB = 5 * 1024 * 1024 bytes)
        if (coverImageFile.size > 5 * 1024 * 1024) {
            toast.error('Cover image file must be less than 5MB')
            return
        }

        const formData = new FormData()
        formData.append('coverImage', coverImageFile)

        try {
            const response = await fetch('http://localhost:8000/api/v1/users/update-cover-image', {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Cover image updated successfully')
                setCoverImageFile(null)
            } else {
                toast.error(data.message || 'Failed to update cover image')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden dark:bg-black">
            {/* Category header */}
            <header className="flex h-16 shrink-0 items-center border-b dark:border-white/10 bg-white dark:bg-black px-4 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 dark:bg-white/10" />
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold pl-2 text-black dark:text-white">Settings</h1>
                </div>
            </header>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-black p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* User Profile Section */}
                    <div className="bg-white dark:bg-black border dark:border-white/10 shadow-md rounded-xl p-6">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <img
                                    src={user?.avatar || '/default-avatar.png'}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-2 border-black dark:border-white"
                                />
                                <div className="absolute bottom-0 right-0 bg-black dark:bg-white text-white dark:text-black rounded-full p-1">
                                    <UserCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-black dark:text-white">{user?.username}</h2>
                                <p className="text-gray-500 dark:text-gray-400">{user?.fullName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="bg-white dark:bg-black border dark:border-white/10 shadow-md rounded-xl p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <LockKeyhole className="w-6 h-6 text-black dark:text-white" />
                            <h3 className="text-xl font-semibold text-black dark:text-white">Change Password</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">Old Password</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter old password"
                                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white"
                                />
                            </div>
                            <button
                                onClick={handlePasswordChange}
                                className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
                            >
                                <LockKeyhole className="w-5 h-5" />
                                <span>Change Password</span>
                            </button>
                        </div>
                    </div>

                    {/* Update Avatar Section */}
                    <div className="bg-white dark:bg-black border dark:border-white/10 shadow-md rounded-xl p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <ImageIcon className="w-6 h-6 text-black dark:text-white" />
                            <h3 className="text-xl font-semibold text-black dark:text-white">Update Avatar</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <img
                                        src={user?.avatar || '/default-avatar.png'}
                                        alt="Current Avatar"
                                        className="w-32 h-32 rounded-full object-cover border-2 border-black dark:border-white"
                                    />
                                    <div className="absolute bottom-0 right-0 bg-black dark:bg-white text-white dark:text-black rounded-full p-2">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) setAvatarFile(file)
                                }}
                                className="w-full text-sm text-gray-500 
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-black file:text-white
                                dark:file:bg-white dark:file:text-black
                                hover:file:opacity-90"
                            />
                            <button
                                onClick={handleAvatarUpdate}
                                disabled={!avatarFile}
                                className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md hover:opacity-90 transition duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                <Upload className="w-5 h-5" />
                                <span>Update Avatar</span>
                            </button>
                        </div>
                    </div>

                    {/* Update Cover Image Section */}
                    <div className="bg-white dark:bg-black border dark:border-white/10 shadow-md rounded-xl p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <ImageIcon className="w-6 h-6 text-black dark:text-white" />
                            <h3 className="text-xl font-semibold text-black dark:text-white">Update Cover Image</h3>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) setCoverImageFile(file)
                                }}
                                className="w-full text-sm text-gray-500 
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-black file:text-white
                                dark:file:bg-white dark:file:text-black
                                hover:file:opacity-90"
                            />
                            <button
                                onClick={handleCoverImageUpdate}
                                disabled={!coverImageFile}
                                className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md hover:opacity-90 transition duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                <Upload className="w-5 h-5" />
                                <span>Update Cover Image</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage
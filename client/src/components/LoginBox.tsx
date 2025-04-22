'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from "sonner"
import { Loader2, Lock } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogFooter
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { LoginSchema, LoginFormInputs } from "@/schemas/login.schemas"
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation' // Import router for redirects/refreshes

export function LoginBox({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogTrigger>) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    // Use the AuthContext
    const { login, isAuthenticated } = useAuth()

    // If user becomes authenticated, close the dialog
    useEffect(() => {
        if (isAuthenticated && isOpen) {
            setIsOpen(false)
            // Optional: refresh the page to show authenticated content
            router.refresh()
        }
    }, [isAuthenticated, isOpen, router])

    const form = useForm<LoginFormInputs>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            username: '',
            password: ''
        }
    })

    const onSubmitLogin = async (data: LoginFormInputs) => {
        setIsSubmitting(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: data.username,
                    email: data.username,
                    password: data.password
                })
            })

            // Parse response before checking status
            const responseBody = await response.text()

            // Check response status explicitly
            if (response.ok) {
                const jsonData = JSON.parse(responseBody)
                toast.success(jsonData.message || 'Login Successful')

                // Fetch current user data after successful login
                const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/get-current-user`, {
                    credentials: 'include'
                })
                const userData = await userResponse.json()

                if (userData.success) {
                    // Use the login function from AuthContext
                    await login(userData.data)

                    // Reset form 
                    form.reset()

                    // The useEffect will close the dialog and refresh the page
                }
            } else {
                const errorData = JSON.parse(responseBody)
                console.log(errorData)
                toast.error(errorData.message || 'Login Failed')
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('An error occurred during login')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!isSubmitting) {
                    setIsOpen(open)
                    if (!open) {
                        // Reset form when dialog is closed
                        form.reset()
                    }
                }
            }}
        >
            <AlertDialogTrigger asChild>
                <button
                    className={className}
                    onClick={() => setIsOpen(true)}
                    {...props}
                >
                    <Lock size={16} /> Login
                </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-md w-full p-0 overflow-hidden">
                <div className="w-full p-6 border-b border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-center">
                            Login to Your Account
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitLogin)} className="space-y-4 w-full">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    className="w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2"
                                                    placeholder="Email or Username"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-destructive text-sm mt-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    className="w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2"
                                                    placeholder="Password"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-destructive text-sm mt-1" />
                                    </FormItem>
                                )}
                            />

                            <div className="text-right mb-4">
                                <a
                                    href="#"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot Password?
                                </a>
                            </div>
                        </form>
                    </Form>
                </div>

                <AlertDialogFooter className="p-6 border-t border-border">
                    <AlertDialogCancel
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        type="submit"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={form.handleSubmit(onSubmitLogin)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            "Login"
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
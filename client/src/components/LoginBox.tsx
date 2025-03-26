'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from "sonner"
import { User, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react'
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

export function LoginBox({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogTrigger>) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<LoginFormInputs>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            username: '',
            password: ''
        }
    })

    const onSubmitLogin = async (data: LoginFormInputs) => {
        setIsSubmitting(true)

        const response = await fetch("http://localhost:8000/api/v1/users/login", {
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
        const responseBody = await response.text();

        // Check response status explicitly
        if (response.ok) {
            const jsonData = JSON.parse(responseBody);
            toast.success(jsonData.message || 'Login Successful')
            setIsOpen(false)
        } else {
            const errorData = JSON.parse(responseBody);
            console.log(errorData)
            toast.error(errorData.message || 'Login Failed')
            setIsSubmitting(false)
        }

    }

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!isSubmitting) {
                    setIsOpen(open)
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
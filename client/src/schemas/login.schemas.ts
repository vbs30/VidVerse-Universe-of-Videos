import { z } from 'zod'

export const LoginSchema = z.object({
    username: z.string().min(3, { message: "Username/Email must be at least 3 characters" })
        .refine((value) => {
            // Check if it's a valid email or username
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(value) || value.length >= 3
        }, { message: "Enter a valid email or username" }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
})

// Export the type for TypeScript inference
export type LoginFormInputs = z.infer<typeof LoginSchema>
import { z } from "zod";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Step 1 Schema - Remains the same
export const signUpStep1Schema = z.object({
    fullName: z.string()
        .min(2, { message: "Full name must be at least 2 characters" })
        .max(50, { message: "Full name cannot exceed 50 characters" })
        .regex(/^[a-zA-Z\s]+$/, { message: "Full name can only contain letters" }),

    username: z.string()
        .min(3, { message: "Username must be at least 3 characters" })
        .max(20, { message: "Username cannot exceed 20 characters" })
        .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),

    email: z.string()
        .email({ message: "Invalid email address" })
});

// New Step 3 Schema for File Uploads
export const signUpStep3Schema = z.object({
    avatar: z.instanceof(File)
        .refine((file) => file.size > 0, { message: "Avatar image is required" })
        .refine((file) => file.size <= MAX_FILE_SIZE, { message: "Avatar image must be less than 5MB" })
        .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: "Only .jpg, .png, .webp and .gif files are accepted for avatar"
        }),
    coverImage: z.instanceof(File)
        .optional()
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
            message: "Cover image must be less than 5MB"
        })
        .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: "Only .jpg, .png, .webp and .gif files are accepted for cover image"
        })
});

// Step 4 Schema - Remains the same
export const signUpStep4Schema = z.object({
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" }),

    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

// Type definitions for TypeScript
export type SignUpStep1 = z.infer<typeof signUpStep1Schema>;
export type SignUpStep3 = z.infer<typeof signUpStep3Schema>;
export type SignUpStep4 = z.infer<typeof signUpStep4Schema>;
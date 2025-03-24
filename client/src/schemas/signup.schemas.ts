import { z } from "zod";

// Sign up form schema - Step 1
export const signUpStep1Schema = z.object({
    fullName: z
        .string()
        .min(1, "Full name is required")
        .max(30, "Full name must be 30 characters or less"),

    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be 20 characters or less")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
});


// Sign up form schema - Step 4 (Password)
export const signUpStep4Schema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
        .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string()
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
);

// Define the type based on the schema
export type SignUpStep1 = z.infer<typeof signUpStep1Schema>;
export type SignUpStep4 = z.infer<typeof signUpStep4Schema>;

'use client'

import { useReducer, useEffect } from "react";
import { ZodError } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, UploadCloud, XCircle, Check, AlertCircle, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { signUpStep1Schema, type SignUpStep1, signUpStep3Schema, signUpStep4Schema, type SignUpStep4 } from "../schemas/signup.schemas";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const steps = ["1", "2", "3", "4"];

// Define state types
type State = {
    step: number;
    isOpen: boolean;
    isSubmitting: boolean;
    profileFile: File | null;
    additionalFile: File | null;
    otpValue: string;
    verificationCode: string;
    isResendingOTP: boolean;
    otpError: string;
    otpComplete: boolean;
    passwordsMatch: boolean;
    passwordValidation: {
        passwordLength: boolean;
        hasUpperCase: boolean;
        hasSpecialChar: boolean;
        hasNumber: boolean;
    };
    fieldValidation: {
        fullNameValid: boolean;
        usernameValid: boolean;
        emailValid: boolean;
    };
    formData: {
        step1: {
            fullName: string;
            username: string;
            email: string;
        };
        step4: {
            password: string;
            confirmPassword: string;
        };
    };
};

// Define action types
type Action =
    | { type: 'SET_STEP'; payload: number }
    | { type: 'SET_DIALOG_OPEN'; payload: boolean }
    | { type: 'SET_SUBMITTING'; payload: boolean }
    | { type: 'SET_PROFILE_FILE'; payload: File | null }
    | { type: 'SET_ADDITIONAL_FILE'; payload: File | null }
    | { type: 'SET_OTP_VALUE'; payload: string }
    | { type: 'SET_VERIFICATION_CODE'; payload: string }
    | { type: 'SET_RESENDING_OTP'; payload: boolean }
    | { type: 'SET_OTP_ERROR'; payload: string }
    | { type: 'SET_OTP_COMPLETE'; payload: boolean }
    | { type: 'SET_PASSWORDS_MATCH'; payload: boolean }
    | { type: 'UPDATE_PASSWORD_VALIDATION'; payload: Partial<State['passwordValidation']> }
    | { type: 'UPDATE_FIELD_VALIDATION'; payload: Partial<State['fieldValidation']> }
    | { type: 'UPDATE_FORM_DATA_STEP1'; payload: SignUpStep1 }
    | { type: 'UPDATE_FORM_DATA_STEP4'; payload: SignUpStep4 }
    | { type: 'RESET_STATE' };

// Initial state
const initialState: State = {
    step: 1,
    isOpen: false,
    isSubmitting: false,
    profileFile: null,
    additionalFile: null,
    otpValue: "",
    verificationCode: "",
    isResendingOTP: false,
    otpError: "",
    otpComplete: false,
    passwordsMatch: false,
    passwordValidation: {
        passwordLength: false,
        hasUpperCase: false,
        hasSpecialChar: false,
        hasNumber: false,
    },
    fieldValidation: {
        fullNameValid: false,
        usernameValid: false,
        emailValid: false,
    },
    formData: {
        step1: {
            fullName: "",
            username: "",
            email: "",
        },
        step4: {
            password: "",
            confirmPassword: "",
        }
    }
};

// Reducer function
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_STEP':
            return { ...state, step: action.payload };
        case 'SET_DIALOG_OPEN':
            return { ...state, isOpen: action.payload };
        case 'SET_SUBMITTING':
            return { ...state, isSubmitting: action.payload };
        case 'SET_PROFILE_FILE':
            return { ...state, profileFile: action.payload };
        case 'SET_ADDITIONAL_FILE':
            return { ...state, additionalFile: action.payload };
        case 'SET_OTP_VALUE':
            return { ...state, otpValue: action.payload };
        case 'SET_VERIFICATION_CODE':
            return { ...state, verificationCode: action.payload };
        case 'SET_RESENDING_OTP':
            return { ...state, isResendingOTP: action.payload };
        case 'SET_OTP_ERROR':
            return { ...state, otpError: action.payload };
        case 'SET_OTP_COMPLETE':
            return { ...state, otpComplete: action.payload };
        case 'SET_PASSWORDS_MATCH':
            return { ...state, passwordsMatch: action.payload };
        case 'UPDATE_PASSWORD_VALIDATION':
            return {
                ...state,
                passwordValidation: {
                    ...state.passwordValidation,
                    ...action.payload
                }
            };
        case 'UPDATE_FIELD_VALIDATION':
            return {
                ...state,
                fieldValidation: {
                    ...state.fieldValidation,
                    ...action.payload
                }
            };
        case 'UPDATE_FORM_DATA_STEP1':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    step1: action.payload
                }
            };
        case 'UPDATE_FORM_DATA_STEP4':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    step4: action.payload
                }
            };
        case 'RESET_STATE':
            return {
                ...initialState,
                isOpen: state.isOpen, // Keep dialog open state
            };
        default:
            return state;
    }
}

export function SignUpBox({ className }: React.ComponentProps<"div">) {
    const { login, checkAuth } = useAuth();
    const [state, dispatch] = useReducer(reducer, initialState);
    const totalSteps = steps.length;

    // Initialize react-hook-form with zod resolver for step 1
    const form = useForm<SignUpStep1>({
        resolver: zodResolver(signUpStep1Schema),
        defaultValues: {
            fullName: "",
            username: "",
            email: "",
        },
        mode: "onChange", // Enable onChange validation mode
    });

    // Initialize password form with zod resolver
    const passwordForm = useForm<SignUpStep4>({
        resolver: zodResolver(signUpStep4Schema),
        defaultValues: {
            password: "",
            confirmPassword: ""
        },
        mode: "onChange", // Enable onChange validation mode
    });

    const onSubmitStep1 = async (data: SignUpStep1) => {
        try {
            // Generate a 6-digit OTP
            const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
            dispatch({ type: 'SET_VERIFICATION_CODE', payload: generatedOTP });

            // Update form data
            dispatch({ type: 'UPDATE_FORM_DATA_STEP1', payload: data });

            // Send verification email using our API endpoint
            const response = await fetch('/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    username: data.username,
                    verificationCode: generatedOTP
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Verification code sent to your email, Please check your inbox or spam folder");
                dispatch({ type: 'SET_STEP', payload: 2 });
            } else {
                toast.error(result.message || "Failed to send verification code");
            }
        } catch (error) {
            console.error("Error in submit step 1:", error);
            toast.error("Something went wrong. Please try again.");
        }
    };

    // Add a function to handle OTP verification
    const verifyOTP = () => {
        if (state.otpValue === state.verificationCode) {
            dispatch({ type: 'SET_OTP_ERROR', payload: "" });
            // Add a slight delay for better UX
            setTimeout(() => {
                dispatch({ type: 'SET_STEP', payload: 3 });
            }, 500);
        } else {
            dispatch({ type: 'SET_OTP_ERROR', payload: "Invalid verification code. Please try again." });
        }
    };

    // Add a function to resend OTP
    const resendOTP = async () => {
        try {
            dispatch({ type: 'SET_RESENDING_OTP', payload: true });

            // Generate a new OTP
            const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
            dispatch({ type: 'SET_VERIFICATION_CODE', payload: newOTP });

            // Send new verification email using our API endpoint
            const response = await fetch('/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: state.formData.step1.email,
                    username: state.formData.step1.username,
                    verificationCode: newOTP
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Verification code resent to your email");
            } else {
                toast.error(result.message || "Failed to resend verification code");
            }
        } catch (error) {
            console.error("Error resending OTP:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            dispatch({ type: 'SET_RESENDING_OTP', payload: false });
        }
    };

    // Check password criteria in real-time
    const checkPasswordCriteria = (password: string) => {
        dispatch({
            type: 'UPDATE_PASSWORD_VALIDATION',
            payload: {
                passwordLength: password.length >= 8,
                hasUpperCase: /[A-Z]/.test(password),
                hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
                hasNumber: /[0-9]/.test(password)
            }
        });
    };

    // Check if passwords match in real-time
    const checkPasswordsMatch = () => {
        const { password, confirmPassword } = passwordForm.getValues();
        dispatch({
            type: 'SET_PASSWORDS_MATCH',
            payload: password === confirmPassword && password !== ""
        });
    };

    // Handle OTP change
    const handleOtpChange = (value: string) => {
        dispatch({ type: 'SET_OTP_VALUE', payload: value });
        dispatch({ type: 'SET_OTP_COMPLETE', payload: value.length === 6 });
        if (state.otpError) dispatch({ type: 'SET_OTP_ERROR', payload: "" });
    };

    // Updated handleFileChange for the reducer pattern
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'profile' | 'additional') => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Validate the file using the schema
                signUpStep3Schema.parse({ avatar: file });
                if (fileType === 'profile') {
                    dispatch({ type: 'SET_PROFILE_FILE', payload: file });
                } else {
                    dispatch({ type: 'SET_ADDITIONAL_FILE', payload: file });
                }
            } catch (error) {
                if (error instanceof ZodError) {
                    toast.error(error.errors[0].message);
                } else {
                    toast.error("An unexpected error occurred");
                }
            }
        }
    };

    // Updated removeFile for the reducer pattern
    const removeFile = (fileType: 'profile' | 'additional') => {
        if (fileType === 'profile') {
            dispatch({ type: 'SET_PROFILE_FILE', payload: null });
        } else {
            dispatch({ type: 'SET_ADDITIONAL_FILE', payload: null });
        }
    };

    // Handle step 4 form submission
    const onSubmitStep4 = async (data: SignUpStep4) => {
        try {
            dispatch({ type: 'SET_SUBMITTING', payload: true });

            // Update form data
            dispatch({ type: 'UPDATE_FORM_DATA_STEP4', payload: data });

            // Create FormData object for file uploads
            const formDataToSend = new FormData();
            formDataToSend.append("fullName", state.formData.step1.fullName);
            formDataToSend.append("username", state.formData.step1.username.toLowerCase());
            formDataToSend.append("email", state.formData.step1.email);
            formDataToSend.append("password", data.password);

            // Add avatar (profile picture) file
            if (state.profileFile) {
                formDataToSend.append("avatar", state.profileFile);
            } else {
                toast.error("Profile image is required");
                return;
            }

            // Add cover image if available (optional)
            if (state.additionalFile) {
                formDataToSend.append("coverImage", state.additionalFile);
            }

            console.log("Form data to send:", formDataToSend);

            // Send data to the API endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/register`, {
                method: "POST",
                body: formDataToSend,
                credentials: 'include', // Add this to include cookies in the request
                // No need to set Content-Type - browser will set it with boundary for FormData
            });

            const responseBody = await response.json();

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${responseBody.message || "Unknown error"}`);
            }

            // Success! Just show a toast and close the modal
            toast.success("Registration successful! Please log in to access your account.");

            // Close the dialog
            dispatch({ type: 'SET_DIALOG_OPEN', payload: false });

        } catch (error: unknown) {
            // Handle errors
            const errorMessage = error instanceof Error ? error.message : "There was a problem creating your account.";
            toast.error(errorMessage);
        } finally {
            dispatch({ type: 'SET_SUBMITTING', payload: false });
        }
    };

    // Watch for step 1 form changes
    useEffect(() => {
        const subscription = form.watch(() => {
            // Check validation status for each field
            const { fullName, username, email } = form.getValues();

            // Update validation states based on field values and error state
            dispatch({
                type: 'UPDATE_FIELD_VALIDATION',
                payload: {
                    fullNameValid: !!fullName && !form.formState.errors.fullName,
                    usernameValid: !!username && !form.formState.errors.username,
                    emailValid: !!email && !form.formState.errors.email
                }
            });
        });

        return () => subscription.unsubscribe();
    }, [form, form.formState]);

    // Handle password changes
    useEffect(() => {
        const subscription = passwordForm.watch((value, { name }) => {
            if (name === "password" || name === "confirmPassword") {
                checkPasswordsMatch();
            }

            if (name === "password") {
                checkPasswordCriteria(value.password || "");
            }
        });
        return () => subscription.unsubscribe();
    }, [passwordForm]);

    // Reset OTP when step changes
    useEffect(() => {
        if (state.step !== 2) {
            dispatch({ type: 'SET_OTP_VALUE', payload: "" });
            dispatch({ type: 'SET_OTP_COMPLETE', payload: false });
        }
    }, [state.step]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (state.isOpen) {
            dispatch({ type: 'RESET_STATE' });
            form.reset();
            passwordForm.reset();
        }
    }, [state.isOpen, form, passwordForm]);

    return (
        <AlertDialog open={state.isOpen} onOpenChange={(open) => {
            if (!state.isSubmitting) {
                dispatch({ type: 'SET_DIALOG_OPEN', payload: open });
            }
        }}>
            <AlertDialogTrigger asChild>
                <button className={className} onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })}>
                    <User size={16} /> Sign Up
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md w-full p-0 overflow-hidden">
                {/* Fixed Header with Title and Progress Bar */}
                <div className="w-full p-6 border-b border-border sticky top-0">
                    <AlertDialogHeader className="mb-0 pb-0">
                        <AlertDialogTitle className="text-xl font-bold text-center">
                            {state.step === 1 ? "Create Your Account" : state.step === 2 ? "Verify Your Email" : state.step === 3 ? "Upload Your Photos" : "Set Your Password"}
                        </AlertDialogTitle>
                    </AlertDialogHeader>

                    {/* Progress Bar with Numbers & Checkmarks - Part of fixed header */}
                    <div className="flex items-center justify-between w-full mt-6 px-2">
                        {steps.map((s, index) => (
                            <div key={index} className={`flex items-center ${index === steps.length - 1 ? "" : "flex-1"}`}>
                                <div
                                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all
                                        ${index + 1 < state.step
                                            ? "bg-green-500 text-white"  // Completed
                                            : index + 1 === state.step
                                                ? "bg-black text-white dark:bg-white dark:text-black"  // Active
                                                : "bg-muted text-muted-foreground" // Inactive
                                        }`}
                                >
                                    {index + 1 < state.step ? <CheckCircle size={20} /> : s}
                                </div>
                                {index !== steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-1 mx-1 ${index + 1 < state.step ? "bg-green-500" : "bg-muted"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content with spacing */}
                <div className="p-6 mt-2 flex flex-col items-center">
                    {/* Step 1 Form with Zod Validation */}
                    {state.step === 1 && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitStep1)} className="space-y-4 w-full">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        className={`w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2 ${field.value && (state.fieldValidation.fullNameValid ? "border-green-500" : "border-destructive")
                                                            }`}
                                                        placeholder="Full Name"
                                                    />
                                                    {field.value && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            {state.fieldValidation.fullNameValid ? (
                                                                <CheckCircle size={18} className="text-green-500" />
                                                            ) : (
                                                                <XCircle size={18} className="text-destructive" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-destructive text-sm mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        className={`w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2 ${field.value && (state.fieldValidation.usernameValid ? "border-green-500" : "border-destructive")
                                                            }`}
                                                        placeholder="Username"
                                                    />
                                                    {field.value && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            {state.fieldValidation.usernameValid ? (
                                                                <CheckCircle size={18} className="text-green-500" />
                                                            ) : (
                                                                <XCircle size={18} className="text-destructive" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-destructive text-sm mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        className={`w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2 ${field.value && (state.fieldValidation.emailValid ? "border-green-500" : "border-destructive")
                                                            }`}
                                                        placeholder="Email ID"
                                                    />
                                                    {field.value && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            {state.fieldValidation.emailValid ? (
                                                                <CheckCircle size={18} className="text-green-500" />
                                                            ) : (
                                                                <XCircle size={18} className="text-destructive" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-destructive text-sm mt-1" />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    )}

                    {state.step === 2 && (
                        <div className="space-y-6 w-full flex flex-col items-center">
                            <p className="text-base text-muted-foreground text-center max-w-sm">
                                Enter the 6-digit code we sent to your email to verify your account
                            </p>
                            <div className="my-8 flex justify-center w-full">
                                <InputOTP
                                    maxLength={6}
                                    value={state.otpValue}
                                    onChange={handleOtpChange}
                                    containerClassName="justify-center"
                                >
                                    <InputOTPGroup className="gap-0">
                                        <InputOTPSlot
                                            index={0}
                                            className="w-12 h-14 text-xl rounded-l-md rounded-r-none"
                                        />
                                        <InputOTPSlot
                                            index={1}
                                            className="w-12 h-14 text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={2}
                                            className="w-12 h-14 text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={3}
                                            className="w-12 h-14 text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={4}
                                            className="w-12 h-14 text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={5}
                                            className="w-12 h-14 text-xl rounded-r-md rounded-l-none border-l-0"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            {state.otpError && (
                                <p className="text-destructive text-sm">
                                    {state.otpError}
                                </p>
                            )}

                            <p className="text-sm text-muted-foreground text-center">
                                Didn&apos;t receive a code? {' '}
                                <button
                                    className="text-blue-500 hover:underline"
                                    onClick={resendOTP}
                                    disabled={state.isResendingOTP}
                                >
                                    {state.isResendingOTP ? (
                                        <>
                                            <Loader2 size={14} className="inline mr-1 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Resend"
                                    )}
                                </button>
                            </p>
                        </div>
                    )}

                    {state.step === 3 && (
                        <div className="space-y-3 w-full">
                            {/* Profile Picture Upload Button */}
                            <label className="flex items-center gap-3 px-4 py-3 border border-border rounded-xl bg-card shadow-sm hover:bg-muted transition cursor-pointer relative w-full">
                                <UploadCloud size={20} className="text-muted-foreground" />
                                <span className="text-foreground font-medium">Upload Avatar Image</span>
                                <span className="text-xs text-destructive ml-1">*required</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'profile')}
                                />
                            </label>

                            {/* Profile Picture Filename Display */}
                            {state.profileFile && (
                                <div className="flex items-center justify-between px-4 py-2 border border-border rounded-lg bg-card mt-2">
                                    <div className="flex items-center">
                                        <Check size={16} className="text-green-500 mr-2" />
                                        <span className="text-sm text-foreground truncate max-w-xs">{state.profileFile.name}</span>
                                    </div>
                                    <button
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => removeFile('profile')}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Additional File Upload Button */}
                            <label className="flex items-center gap-3 px-4 py-3 border border-border rounded-xl bg-card shadow-sm hover:bg-muted transition cursor-pointer relative w-full mt-4">
                                <UploadCloud size={20} className="text-muted-foreground" />
                                <span className="text-foreground font-medium">Upload Cover Image</span>
                                <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'additional')}
                                />
                            </label>

                            {/* Additional File Filename Display */}
                            {state.additionalFile && (
                                <div className="flex items-center justify-between px-4 py-2 border border-border rounded-lg bg-card mt-2">
                                    <div className="flex items-center">
                                        <Check size={16} className="text-green-500 mr-2" />
                                        <span className="text-sm text-foreground truncate max-w-xs">{state.additionalFile.name}</span>
                                    </div>
                                    <button
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => removeFile('additional')}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {state.step === 4 && (
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onSubmitStep4)} className="space-y-6 w-full">
                                <div className="space-y-3">
                                    <FormField
                                        control={passwordForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        className="w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2"
                                                        placeholder="Password"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-destructive text-sm mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Password Criteria Indicators */}
                                    <div className="flex flex-col space-y-2 my-3">
                                        <div className="flex items-center space-x-2">
                                            {state.passwordValidation.passwordLength ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${state.passwordValidation.passwordLength ? "text-green-500" : "text-muted-foreground"}`}>
                                                Min. 8 characters
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {state.passwordValidation.hasUpperCase ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${state.passwordValidation.hasUpperCase ? "text-green-500" : "text-muted-foreground"}`}>
                                                Uppercase letter
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {state.passwordValidation.hasSpecialChar ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${state.passwordValidation.hasSpecialChar ? "text-green-500" : "text-muted-foreground"}`}>
                                                Special character
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {state.passwordValidation.hasNumber ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${state.passwordValidation.hasNumber ? "text-green-500" : "text-muted-foreground"}`}>
                                                Number
                                            </span>
                                        </div>
                                    </div>

                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        className="w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2"
                                                        placeholder="Confirm Password"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-destructive text-sm mt-1" />
                                                {/* Password Match Indicator */}
                                                {field.value && (
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        {state.passwordsMatch ? (
                                                            <>
                                                                <CheckCircle size={16} className="text-green-500" />
                                                                <span className="text-sm text-green-500">Passwords match</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle size={16} className="text-destructive" />
                                                                <span className="text-sm text-destructive">Passwords do not match</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    )}
                </div>

                {/* Navigation Buttons */}
                <AlertDialogFooter className="p-6 border-t border-border">
                    <AlertDialogCancel
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: false })}
                        disabled={state.isSubmitting}
                    >
                        Cancel
                    </AlertDialogCancel>
                    {state.step > 1 && (
                        <Button
                            variant="outline"
                            onClick={() => dispatch({ type: 'SET_STEP', payload: state.step - 1 })}
                            disabled={state.isSubmitting}
                        >
                            Previous
                        </Button>
                    )}
                    {state.step < totalSteps ? (
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                                if (state.step === 1) {
                                    form.handleSubmit(onSubmitStep1)();
                                } else if (state.step === 2) {
                                    verifyOTP(); // Use our verification function
                                } else {
                                    dispatch({ type: 'SET_STEP', payload: state.step + 1 });
                                }
                            }}
                            disabled={
                                (state.step === 2 && !state.otpComplete) ||
                                (state.step === 3 && !state.profileFile) ||
                                state.isSubmitting
                            }
                            type={state.step === 1 ? "button" : "button"}
                        >
                            {state.step === 2 ? "Verify" : "Next"}
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={passwordForm.handleSubmit(onSubmitStep4)}
                            disabled={
                                !state.passwordsMatch ||
                                !state.passwordValidation.passwordLength ||
                                !state.passwordValidation.hasUpperCase ||
                                !state.passwordValidation.hasSpecialChar ||
                                !state.passwordValidation.hasNumber ||
                                !state.profileFile ||
                                state.isSubmitting
                            }
                        >
                            {state.isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
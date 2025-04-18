'use client'

import { useState, useEffect } from "react";
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

export function SignUpBox({ className }: React.ComponentProps<"div">) {
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const totalSteps = steps.length;
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [additionalFile, setAdditionalFile] = useState<File | null>(null);
    const [otpValue, setOtpValue] = useState<string>("");
    const [verificationCode, setVerificationCode] = useState<string>("");
    const [isResendingOTP, setIsResendingOTP] = useState<boolean>(false);
    const [otpError, setOtpError] = useState<string>("");
    const [otpComplete, setOtpComplete] = useState<boolean>(false);
    const [passwordsMatch, setPasswordsMatch] = useState<boolean>(false);

    // Password validation states
    const [passwordLength, setPasswordLength] = useState<boolean>(false);
    const [hasUpperCase, setHasUpperCase] = useState<boolean>(false);
    const [hasSpecialChar, setHasSpecialChar] = useState<boolean>(false);
    const [hasNumber, setHasNumber] = useState<boolean>(false);

    //validation states
    const [fullNameValid, setFullNameValid] = useState<boolean>(false);
    const [usernameValid, setUsernameValid] = useState<boolean>(false);
    const [emailValid, setEmailValid] = useState<boolean>(false);

    // Form data storage
    const [formData, setFormData] = useState({
        step1: {
            fullName: "",
            username: "",
            email: "",
        },
        step4: {
            password: "",
            confirmPassword: "",
        }
    });

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

    // const fileForm = useForm<SignUpStep3>({
    //     resolver: zodResolver(signUpStep3Schema),
    //     defaultValues: {
    //         avatar: undefined,
    //         coverImage: undefined
    //     },
    //     mode: "onChange"
    // });


    const onSubmitStep1 = async (data: SignUpStep1) => {
        try {
            // Generate a 6-digit OTP
            const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationCode(generatedOTP);

            // Update form data
            setFormData(prev => ({
                ...prev,
                step1: data,
            }));

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
                setStep(2);
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
        if (otpValue === verificationCode) {
            setOtpError("");
            // Add a slight delay for better UX
            setTimeout(() => {
                setStep(3);
            }, 500);
        } else {
            setOtpError("Invalid verification code. Please try again.");
        }
    };

    // Add a function to resend OTP
    const resendOTP = async () => {
        try {
            setIsResendingOTP(true);

            // Generate a new OTP
            const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationCode(newOTP);

            // Send new verification email using our API endpoint
            const response = await fetch('/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.step1.email,
                    username: formData.step1.username,
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
            setIsResendingOTP(false);
        }
    };

    // Check password criteria in real-time
    const checkPasswordCriteria = (password: string) => {
        setPasswordLength(password.length >= 8);
        setHasUpperCase(/[A-Z]/.test(password));
        setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>]/.test(password));
        setHasNumber(/[0-9]/.test(password));
    };

    // Check if passwords match in real-time
    const checkPasswordsMatch = () => {
        const { password, confirmPassword } = passwordForm.getValues();
        setPasswordsMatch(password === confirmPassword && password !== "");
    };

    // Watch for step 1 form changes
    useEffect(() => {
        const subscription = form.watch(() => {
            // Check validation status for each field
            const { fullName, username, email } = form.getValues();

            // Update validation states based on field values and error state
            setFullNameValid(!!fullName && !form.formState.errors.fullName);
            setUsernameValid(!!username && !form.formState.errors.username);
            setEmailValid(!!email && !form.formState.errors.email);
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

    // Handle OTP change
    const handleOtpChange = (value: string) => {
        setOtpValue(value);
        setOtpComplete(value.length === 6);
        if (otpError) setOtpError("");
    };

    // Handle file selection - modified to store file info instead of preview image
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Validate the file using the schema
                signUpStep3Schema.parse({ avatar: file });
                setFile(file);
            } catch (error) {
                if (error instanceof ZodError) {
                    toast.error(error.errors[0].message);
                } else {
                    toast.error("An unexpected error occurred");
                }
            }
        }
    };

    // Remove selected file
    const removeFile = (setFile: (file: File | null) => void) => setFile(null);

    // Handle step 4 form submission
    const onSubmitStep4 = async (data: SignUpStep4) => {
        try {
            setIsSubmitting(true);

            // Update form data
            setFormData(prev => ({
                ...prev,
                step4: data,
            }));

            // Create FormData object for file uploads
            const formDataToSend = new FormData();
            formDataToSend.append("fullName", formData.step1.fullName);
            formDataToSend.append("username", formData.step1.username.toLowerCase());
            formDataToSend.append("email", formData.step1.email);
            formDataToSend.append("password", data.password);

            // Add avatar (profile picture) file
            if (profileFile) {
                formDataToSend.append("avatar", profileFile);
            } else {
                toast.error("Profile image is required");
            }

            // Add cover image if available (optional)
            if (additionalFile) {
                formDataToSend.append("coverImage", additionalFile);
            }

            console.log("Form data to send:", formDataToSend);

            // Send data to the API endpoint
            const response = await fetch("https://vidverse-backend.vercel.app/api/v1/users/register", {
                method: "POST",
                body: formDataToSend,
                // No need to set Content-Type - browser will set it with boundary for FormData
            });

            // Handle API response
            const responseBody = await response.json();

            if (!response.ok) {
                const errorText = await response.text(); // Get the response text
                throw new Error(`Error ${response.status}: ${errorText}`); // Throw an error with the status and response text
            }

            // Success - fetch current user data
            const userResponse = await fetch('https://vidverse-backend.vercel.app/api/v1/users/get-current-user', {
                credentials: 'include'
            });
            const userData = await userResponse.json();

            if (userData.success) {
                login(userData.data);
            }

            // Success - close dialog and show success message
            toast.success(responseBody.message || "Registration successful! Your account has been created successfully.");
            setIsOpen(false);

        } catch (error: unknown) {
            // Handle errors
            const errorMessage = error instanceof Error ? error.message : "There was a problem creating your account.";
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset OTP when step changes
    useEffect(() => {
        if (step !== 2) {
            setOtpValue("");
            setOtpComplete(false);
        }
    }, [step]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            form.reset();
            passwordForm.reset();
            setPasswordLength(false);
            setHasUpperCase(false);
            setHasSpecialChar(false);
            setHasNumber(false);
            setPasswordsMatch(false);
            setFullNameValid(false);
            setUsernameValid(false);
            setEmailValid(false);
            setProfileFile(null);
            setAdditionalFile(null);
        }
    }, [isOpen, form, passwordForm]);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            if (!isSubmitting) {
                setIsOpen(open);
                if (open) setStep(1); // Reset step when opening
            }
        }}>
            <AlertDialogTrigger asChild>
                <button className={className} onClick={() => setIsOpen(true)}>
                    <User size={16} /> Sign Up
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md w-full p-0 overflow-hidden">
                {/* Fixed Header with Title and Progress Bar */}
                <div className="w-full p-6 border-b border-border sticky top-0">
                    <AlertDialogHeader className="mb-0 pb-0">
                        <AlertDialogTitle className="text-xl font-bold text-center">
                            {step === 1 ? "Create Your Account" : step === 2 ? "Verify Your Email" : step === 3 ? "Upload Your Photos" : "Set Your Password"}
                        </AlertDialogTitle>
                    </AlertDialogHeader>

                    {/* Progress Bar with Numbers & Checkmarks - Part of fixed header */}
                    <div className="flex items-center justify-between w-full mt-6 px-2">
                        {steps.map((s, index) => (
                            <div key={index} className={`flex items-center ${index === steps.length - 1 ? "" : "flex-1"}`}>
                                <div
                                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all
                                        ${index + 1 < step
                                            ? "bg-green-500 text-white"  // Completed
                                            : index + 1 === step
                                                ? "bg-black text-white dark:bg-white dark:text-black"  // Active
                                                : "bg-muted text-muted-foreground" // Inactive
                                        }`}
                                >
                                    {index + 1 < step ? <CheckCircle size={20} /> : s}
                                </div>
                                {index !== steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-1 mx-1 ${index + 1 < step ? "bg-green-500" : "bg-muted"
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
                    {step === 1 && (
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
                                                        className={`w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2 ${field.value && (fullNameValid ? "border-green-500" : "border-destructive")
                                                            }`}
                                                        placeholder="Full Name"
                                                    />
                                                    {field.value && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            {fullNameValid ? (
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
                                                        className={`w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2 ${field.value && (usernameValid ? "border-green-500" : "border-destructive")
                                                            }`}
                                                        placeholder="Username"
                                                    />
                                                    {field.value && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            {usernameValid ? (
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
                                                        className={`w-full rounded-xl focus:ring-2 focus:ring-primary shadow-sm px-4 py-2 ${field.value && (emailValid ? "border-green-500" : "border-destructive")
                                                            }`}
                                                        placeholder="Email ID"
                                                    />
                                                    {field.value && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            {emailValid ? (
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

                    {step === 2 && (
                        <div className="space-y-6 w-full flex flex-col items-center">
                            <p className="text-base text-muted-foreground text-center max-w-sm">
                                Enter the 6-digit code we sent to your email to verify your account
                            </p>
                            <div className="my-8 flex justify-center w-full">
                                <InputOTP
                                    maxLength={6}
                                    value={otpValue}
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

                            {otpError && (
                                <p className="text-destructive text-sm">
                                    {otpError}
                                </p>
                            )}

                            <p className="text-sm text-muted-foreground text-center">
                                Didn&apos;t receive a code? {' '}
                                <button
                                    className="text-blue-500 hover:underline"
                                    onClick={resendOTP}
                                    disabled={isResendingOTP}
                                >
                                    {isResendingOTP ? (
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

                    {step === 3 && (
                        <div className="space-y-3 w-full">
                            {/* Profile Picture Upload Button */}
                            <label className="flex items-center gap-3 px-4 py-3 border border-border rounded-xl bg-card shadow-sm hover:bg-muted transition cursor-pointer relative w-full">
                                <UploadCloud size={20} className="text-muted-foreground" />
                                <span className="text-foreground font-medium">Upload Avatar Image</span>
                                <span className="text-xs text-destructive ml-1">*required</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setProfileFile)} />
                            </label>

                            {/* Profile Picture Filename Display */}
                            {profileFile && (
                                <div className="flex items-center justify-between px-4 py-2 border border-border rounded-lg bg-card mt-2">
                                    <div className="flex items-center">
                                        <Check size={16} className="text-green-500 mr-2" />
                                        <span className="text-sm text-foreground truncate max-w-xs">{profileFile.name}</span>
                                    </div>
                                    <button
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => removeFile(setProfileFile)}
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
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setAdditionalFile)} />
                            </label>

                            {/* Additional File Filename Display */}
                            {additionalFile && (
                                <div className="flex items-center justify-between px-4 py-2 border border-border rounded-lg bg-card mt-2">
                                    <div className="flex items-center">
                                        <Check size={16} className="text-green-500 mr-2" />
                                        <span className="text-sm text-foreground truncate max-w-xs">{additionalFile.name}</span>
                                    </div>
                                    <button
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => removeFile(setAdditionalFile)}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
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
                                            {passwordLength ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${passwordLength ? "text-green-500" : "text-muted-foreground"}`}>
                                                Min. 8 characters
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {hasUpperCase ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${hasUpperCase ? "text-green-500" : "text-muted-foreground"}`}>
                                                Uppercase letter
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {hasSpecialChar ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${hasSpecialChar ? "text-green-500" : "text-muted-foreground"}`}>
                                                Special character
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {hasNumber ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={16} className="text-muted-foreground" />
                                            )}
                                            <span className={`text-sm ${hasNumber ? "text-green-500" : "text-muted-foreground"}`}>
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
                                                        {passwordsMatch ? (
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
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AlertDialogCancel>
                    {step > 1 && (
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                            disabled={isSubmitting}
                        >
                            Previous
                        </Button>
                    )}
                    {step < totalSteps ? (
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                                if (step === 1) {
                                    form.handleSubmit(onSubmitStep1)();
                                } else if (step === 2) {
                                    verifyOTP(); // Use our verification function
                                } else {
                                    setStep(step + 1);
                                }
                            }}
                            disabled={
                                (step === 2 && !otpComplete) ||
                                (step === 3 && !profileFile) ||
                                isSubmitting
                            }
                            type={step === 1 ? "button" : "button"}
                        >
                            {step === 2 ? "Verify" : "Next"}
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={passwordForm.handleSubmit(onSubmitStep4)}
                            disabled={
                                !passwordsMatch ||
                                !passwordLength ||
                                !hasUpperCase ||
                                !hasSpecialChar ||
                                !hasNumber ||
                                !profileFile ||
                                isSubmitting
                            }
                        >
                            {isSubmitting ? (
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
'use client'

import { useState, useEffect } from "react";
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
import { CheckCircle, User, UploadCloud, XCircle, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp"

const steps = ["1", "2", "3", "4"];

export function SignUpBox({ className, ...props }: React.ComponentProps<"div">) {
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false); // Track modal open state
    const totalSteps = steps.length;
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [additionalFile, setAdditionalFile] = useState<File | null>(null);
    const [otpValue, setOtpValue] = useState<string>("");
    const [otpComplete, setOtpComplete] = useState<boolean>(false);

    // Handle OTP change
    const handleOtpChange = (value: string) => {
        setOtpValue(value);
        setOtpComplete(value.length === 6);

        // Auto proceed to next step if OTP is complete
        if (value.length === 6) {
            // Add a slight delay for better UX
            setTimeout(() => {
                setStep(3);
            }, 500);
        }
    };

    // Handle file selection - modified to store file info instead of preview image
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            setFile(file);
        }
    };

    // Remove selected file
    const removeFile = (setFile: (file: File | null) => void) => setFile(null);

    // Reset OTP when step changes
    useEffect(() => {
        if (step !== 2) {
            setOtpValue("");
            setOtpComplete(false);
        }
    }, [step]);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) setStep(1); // Reset step when opening
        }}>
            <AlertDialogTrigger asChild>
                <button className={className} onClick={() => setIsOpen(true)}>
                    <User size={16} /> Sign Up
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md w-full p-0 overflow-hidden bg-gray-900 text-white">
                {/* Fixed Header with Title and Progress Bar */}
                <div className="w-full p-6 border-b border-gray-700 sticky top-0">
                    <AlertDialogHeader className="mb-0 pb-0">
                        <AlertDialogTitle className="text-xl font-bold text-center text-white">
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
                                                ? "bg-gray-800 text-white border-2 border-white"  // Active (Dark Gray)
                                                : "bg-gray-600 text-gray-300" // Inactive
                                        }`}
                                >
                                    {index + 1 < step ? <CheckCircle size={20} /> : s}
                                </div>
                                {index !== steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-1 mx-1 ${index + 1 < step ? "bg-green-500" : "bg-gray-600"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content with spacing */}
                <div className="p-6 mt-8 flex flex-col items-center">
                    {/* Step Forms */}
                    {step === 1 && (
                        <div className="space-y-4 w-full">
                            <Input className="w-full rounded-xl border-gray-700 bg-gray-800 focus:border-white focus:ring-2 focus:ring-white shadow-sm px-4 py-2 text-white" placeholder="Full Name" required />
                            <Input className="w-full rounded-xl border-gray-700 bg-gray-800 focus:border-white focus:ring-2 focus:ring-white shadow-sm px-4 py-2 text-white" placeholder="Username" required />
                            <Input type="email" className="w-full rounded-xl border-gray-700 bg-gray-800 focus:border-white focus:ring-2 focus:ring-white shadow-sm px-4 py-2 text-white" placeholder="Email ID" required />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 w-full flex flex-col items-center">
                            <p className="text-base text-gray-300 text-center max-w-sm">
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
                                            className="w-12 h-14 border-gray-600 bg-gray-800 text-white text-xl rounded-l-md rounded-r-none"
                                        />
                                        <InputOTPSlot
                                            index={1}
                                            className="w-12 h-14 border-gray-600 bg-gray-800 text-white text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={2}
                                            className="w-12 h-14 border-gray-600 bg-gray-800 text-white text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={3}
                                            className="w-12 h-14 border-gray-600 bg-gray-800 text-white text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={4}
                                            className="w-12 h-14 border-gray-600 bg-gray-800 text-white text-xl rounded-none border-l-0"
                                        />
                                        <InputOTPSlot
                                            index={5}
                                            className="w-12 h-14 border-gray-600 bg-gray-800 text-white text-xl rounded-r-md rounded-l-none border-l-0"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <p className="text-sm text-gray-400 text-center">
                                Didn't receive a code? <button className="text-blue-400 hover:underline">Resend</button>
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-3 w-full">
                            {/* Profile Picture Upload Button */}
                            <label className="flex items-center gap-3 px-4 py-3 border border-gray-700 rounded-xl bg-gray-800 shadow-sm hover:bg-gray-700 transition cursor-pointer relative w-full">
                                <UploadCloud size={20} className="text-gray-300" />
                                <span className="text-gray-300 font-medium">Upload Profile Picture</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setProfileFile)} />
                            </label>

                            {/* Profile Picture Filename Display */}
                            {profileFile && (
                                <div className="flex items-center justify-between px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 mt-2">
                                    <div className="flex items-center">
                                        <Check size={16} className="text-green-500 mr-2" />
                                        <span className="text-sm text-gray-300 truncate max-w-xs">{profileFile.name}</span>
                                    </div>
                                    <button
                                        className="text-gray-400 hover:text-white"
                                        onClick={() => removeFile(setProfileFile)}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Additional File Upload Button */}
                            <label className="flex items-center gap-3 px-4 py-3 border border-gray-700 rounded-xl bg-gray-800 shadow-sm hover:bg-gray-700 transition cursor-pointer relative w-full mt-4">
                                <UploadCloud size={20} className="text-gray-300" />
                                <span className="text-gray-300 font-medium">Upload Additional File</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setAdditionalFile)} />
                            </label>

                            {/* Additional File Filename Display */}
                            {additionalFile && (
                                <div className="flex items-center justify-between px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 mt-2">
                                    <div className="flex items-center">
                                        <Check size={16} className="text-green-500 mr-2" />
                                        <span className="text-sm text-gray-300 truncate max-w-xs">{additionalFile.name}</span>
                                    </div>
                                    <button
                                        className="text-gray-400 hover:text-white"
                                        onClick={() => removeFile(setAdditionalFile)}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-3 w-full">
                            <Input type="password" className="w-full rounded-xl border-gray-700 bg-gray-800 focus:border-white focus:ring-2 focus:ring-white shadow-sm px-4 py-2 text-white" placeholder="Password" required />
                            <Input type="password" className="w-full rounded-xl border-gray-700 bg-gray-800 focus:border-white focus:ring-2 focus:ring-white shadow-sm px-4 py-2 text-white" placeholder="Confirm Password" required />
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <AlertDialogFooter className="p-6 border-t border-gray-700">
                    <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700" onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
                    {step > 1 && <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700" onClick={() => setStep(step - 1)}>Previous</Button>}
                    {step < totalSteps ? (
                        <Button
                            className="bg-white text-black hover:bg-gray-200"
                            onClick={() => setStep(step + 1)}
                            disabled={step === 2 && !otpComplete}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button type="submit" className="bg-white text-black hover:bg-gray-200">Submit</Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
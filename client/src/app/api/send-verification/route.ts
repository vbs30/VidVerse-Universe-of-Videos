import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateVerificationEmail } from '@/lib/email-utils';

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function POST(request: Request) {
    try {
        const { email, username, verificationCode } = await request.json();

        if (!email || !username || !verificationCode) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate HTML directly using our utility function
        const emailHtml = generateVerificationEmail({
            username,
            otp: verificationCode
        });

        // Send email using Nodemailer
        const mailOptions = {
            from: 'VidVerse <vbs02002@gmail.com>',
            to: email,
            subject: 'Verification Code',
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
// lib/email-utils.ts
interface VerificationEmailProps {
    username: string;
    otp: string;
}

export function generateVerificationEmail({ username, otp }: VerificationEmailProps): string {
    return `
      <!DOCTYPE html>
      <html lang="en" dir="ltr">
        <head>
          <meta charset="utf-8">
          <title>Welcome to VidVerse - Verification Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&family=Poppins:wght@600&display=swap');
            
            body {
              font-family: 'Roboto', Verdana, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            
            .header-section {
              background-color: #121212;
              padding: 30px 20px;
              text-align: center;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            
            .logo-heading {
              font-family: 'Poppins', Helvetica, sans-serif;
              font-size: 32px;
              color: #9744FF;
              margin: 0;
              letter-spacing: 1px;
            }
            
            .accent-text {
              color: #f7f9fa;
            }
            
            .tagline {
              color: #b3b3b3;
              font-size: 14px;
              margin: 5px 0 0;
            }
            
            .main-section {
              padding: 40px 30px;
              background-color: #f9f9f9;
            }
            
            .welcome-heading {
              font-family: 'Poppins', Helvetica, sans-serif;
              font-size: 24px;
              color: #333333;
              margin: 0 0 20px;
            }
            
            .paragraph {
              font-size: 16px;
              line-height: 24px;
              color: #555555;
              margin: 0 0 24px;
            }
            
            .otp-container {
              margin: 20px 0 30px;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
              text-align: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            }
            
            .otp-code {
              font-family: monospace;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 5px;
              color: #333;
              margin: 0;
            }
            
            .footer-section {
              padding: 30px 20px;
              background-color: #f0f0f0;
              border-bottom-left-radius: 8px;
              border-bottom-right-radius: 8px;
              text-align: center;
            }
            
            .footer-text {
              font-size: 14px;
              color: #777777;
              margin: 0 0 10px;
            }

          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-section">
              <h1 class="logo-heading">Vid<span class="accent-text">Verse</span></h1>
              <p class="tagline">Beyond videos - a universe of expression</p>
            </div>
            
            <div class="main-section">
              <h2 class="welcome-heading">Welcome to VidVerse, ${username}!</h2>
              <p class="paragraph">
                To complete your registration and start exploring amazing video content, please verify your account using the code below:
              </p>
              
              <div class="otp-container">
                <p class="otp-code">${otp}</p>
              </div>
              
              <p class="paragraph">
                This code will expire in 10 minutes. If you did not request this code, please ignore this email.
              </p>
            </div>
            
            <div class="footer-section">
              <p class="footer-text">© 2025 VidVerse. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
}
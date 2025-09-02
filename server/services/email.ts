import { storage } from "../storage";

interface EmailConfig {
  from: string;
  smtpUrl: string;
}

export function getEmailConfig(): EmailConfig {
  const from = process.env.MAGICLINK_FROM || "noreply@permitsync.local";
  const smtpUrl = process.env.MAGICLINK_SMTP_URL || "smtp://user:pass@smtp.example.com:587";
  
  return { from, smtpUrl };
}

export async function sendEmail(
  to: string, 
  subject: string, 
  text: string, 
  html?: string
): Promise<void> {
  const config = getEmailConfig();
  
  // In a real implementation, this would use a service like SendGrid, AWS SES, or Nodemailer
  console.log(`📧 Email Service (Mock)`);
  console.log(`To: ${to}`);
  console.log(`From: ${config.from}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log(`HTML: ${html || 'N/A'}`);
  console.log(`---`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;
  
  const subject = "Sign in to Permit Orchestrator";
  const text = `Click this link to sign in: ${verifyUrl}\n\nThis link expires in 15 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Sign in to Permit Orchestrator</h2>
      <p>Click the button below to sign in to your account:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verifyUrl}" 
           style="background-color: #1e40af; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Sign In
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 12px;">
        Link: ${verifyUrl}
      </p>
    </div>
  `;
  
  await sendEmail(email, subject, text, html);
}

export async function sendPermitStatusUpdate(
  userEmail: string, 
  projectName: string, 
  status: string
): Promise<void> {
  const subject = `Permit Status Update - ${projectName}`;
  const text = `Your permit for ${projectName} has been updated to: ${status}`;
  
  await sendEmail(userEmail, subject, text);
}

export async function sendInspectionReminder(
  userEmail: string, 
  projectName: string, 
  inspectionType: string, 
  scheduledDate: Date
): Promise<void> {
  const subject = `Inspection Reminder - ${projectName}`;
  const text = `Reminder: ${inspectionType} inspection scheduled for ${scheduledDate.toLocaleDateString()} for ${projectName}`;
  
  await sendEmail(userEmail, subject, text);
}

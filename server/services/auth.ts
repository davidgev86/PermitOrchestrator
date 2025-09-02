import { storage } from "../storage";
import crypto from "crypto";

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
const magicTokenStore = new Map<string, { email: string; expiresAt: Date }>();

export async function sendMagicLink(email: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);
  
  magicTokenStore.set(token, { email, expiresAt });
  
  // In a real implementation, this would send an actual email
  console.log(`Magic link for ${email}: http://localhost:5000/auth/verify?token=${token}`);
  
  // Clean up expired tokens
  for (const [key, value] of magicTokenStore.entries()) {
    if (value.expiresAt < new Date()) {
      magicTokenStore.delete(key);
    }
  }
}

export async function verifyMagicLink(token: string): Promise<string | null> {
  const tokenData = magicTokenStore.get(token);
  
  if (!tokenData || tokenData.expiresAt < new Date()) {
    magicTokenStore.delete(token);
    return null;
  }
  
  // Clean up used token
  magicTokenStore.delete(token);
  
  return tokenData.email;
}

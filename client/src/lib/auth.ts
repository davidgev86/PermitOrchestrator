import { apiRequest } from "./queryClient";

export interface User {
  email: string;
  sessionToken: string;
  expiresAt: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionToken = localStorage.getItem("sessionToken");
  const userEmail = localStorage.getItem("userEmail");
  
  if (!sessionToken || !userEmail) {
    return null;
  }

  // In a real implementation, you might want to validate the token with the server
  // For now, we'll trust the local storage
  try {
    // You could add a /api/me endpoint to validate the session
    return {
      email: userEmail,
      sessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    // Clear invalid session
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("userEmail");
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("userEmail");
}

export function getAuthHeader(): Record<string, string> {
  const sessionToken = localStorage.getItem("sessionToken");
  if (!sessionToken) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${sessionToken}`,
  };
}

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

  try {
    const response = await fetch("/api/user", {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      // Clear invalid session
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("userEmail");
      return null;
    }

    return await response.json();
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

import type { User } from '@/types';

const STORAGE_KEY = 'circuitus_user';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function login(email: string, _password: string): User {
  const user: User = {
    email,
    loggedIn: true,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser(): User | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null && user.loggedIn === true;
}

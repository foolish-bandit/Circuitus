import type { User } from '@/types';

const STORAGE_KEY = 'circuitus_user';
const PASSPHRASE_HASH_KEY = 'circuitus_passphrase';

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasPassphrase(): boolean {
  return localStorage.getItem(PASSPHRASE_HASH_KEY) !== null;
}

export async function setPassphrase(passphrase: string): Promise<void> {
  if (!passphrase) {
    localStorage.removeItem(PASSPHRASE_HASH_KEY);
    return;
  }
  const hash = await sha256(passphrase);
  localStorage.setItem(PASSPHRASE_HASH_KEY, hash);
}

export function clearPassphrase(): void {
  localStorage.removeItem(PASSPHRASE_HASH_KEY);
}

/**
 * Returns the user on success, or null if the supplied password fails the
 * passphrase check. If no passphrase is configured, any input is accepted
 * (preserves the original cosmetic-login behavior).
 */
export async function login(email: string, password: string): Promise<User | null> {
  const stored = localStorage.getItem(PASSPHRASE_HASH_KEY);
  if (stored) {
    const supplied = await sha256(password);
    if (supplied !== stored) return null;
  }
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

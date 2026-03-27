export type ConsoleViewMode = 'merchant' | 'admin';

export interface AdminProfile {
  id: number;
  name: string;
  userName: string;
}

const USER_TOKEN_KEY = 'sky-web:user-token';
const ADMIN_TOKEN_KEY = 'sky-web:admin-token';
const ADMIN_PROFILE_KEY = 'sky-web:admin-profile';
const CONSOLE_VIEW_MODE_KEY = 'sky-web:console-view-mode';

function readStorage(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorage(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

export function getUserToken() {
  return readStorage(USER_TOKEN_KEY);
}

export function setUserToken(token: string) {
  writeStorage(USER_TOKEN_KEY, token);
}

export function clearUserToken() {
  removeStorage(USER_TOKEN_KEY);
}

export function getAdminToken() {
  return readStorage(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  writeStorage(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  removeStorage(ADMIN_TOKEN_KEY);
}

export function getAdminProfile() {
  const raw = readStorage(ADMIN_PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminProfile;
  } catch {
    return null;
  }
}

export function setAdminProfile(profile: AdminProfile) {
  writeStorage(ADMIN_PROFILE_KEY, JSON.stringify(profile));
}

export function clearAdminProfile() {
  removeStorage(ADMIN_PROFILE_KEY);
}

export function clearAdminSession() {
  clearAdminToken();
  clearAdminProfile();
}

export function getConsoleViewMode(): ConsoleViewMode {
  const stored = readStorage(CONSOLE_VIEW_MODE_KEY);
  return stored === 'admin' ? 'admin' : 'merchant';
}

export function setConsoleViewMode(mode: ConsoleViewMode) {
  writeStorage(CONSOLE_VIEW_MODE_KEY, mode);
}

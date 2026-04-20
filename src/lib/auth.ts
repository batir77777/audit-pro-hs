const USERS_KEY = 'sitk_users';
const SESSION_KEY = 'sitk_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string; // always lowercase
  passwordHash: string; // hex: 32-char salt + 64-char SHA-256 hash
  createdAt: string;
}

interface Session {
  userId: string;
  name: string;
  email: string;
  expiresAt: number;
}

// ---------- Crypto helpers ----------

function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt);
  return toHex(salt) + toHex(new Uint8Array(hash));
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const salt = fromHex(stored.slice(0, 32)); // 16 bytes = 32 hex chars
  const storedHash = stored.slice(32);
  const hash = await deriveKey(password, salt);
  return toHex(new Uint8Array(hash)) === storedHash;
}

// ---------- User storage ----------

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ---------- Session ----------

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { id: session.userId, name: session.name, email: session.email };
  } catch {
    return null;
  }
}

function createSession(user: StoredUser): AuthUser {
  const session: Session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { id: user.id, name: user.name, email: user.email };
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Returns the current user's id or null — used outside of React (e.g. mockData.ts). */
export function getCurrentUserId(): string | null {
  return getSession()?.id ?? null;
}

// ---------- Auth operations ----------

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const normalEmail = email.toLowerCase().trim();
  const users = getStoredUsers();

  if (users.some(u => u.email === normalEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  persistUsers([...users, newUser]);
  return createSession(newUser);
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const normalEmail = email.toLowerCase().trim();
  const users = getStoredUsers();
  const user = users.find(u => u.email === normalEmail);

  // Always run verifyPassword to avoid timing-based user enumeration
  const hashToCheck = user?.passwordHash ?? 'a'.repeat(96);
  const valid = user ? await verifyPassword(password, hashToCheck) : false;

  if (!user || !valid) {
    throw new Error('Invalid email or password.');
  }

  return createSession(user);
}

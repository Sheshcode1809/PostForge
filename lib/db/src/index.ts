import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SessionRecord {
  id: string; // token
  userId: string;
  expiresAt: number;
  createdAt: number;
}

export interface SyncedDraftRecord {
  id: string;
  userId: string;
  title: string;
  topic: string;
  post: string;
  hashtags: string[];
  tone?: string;
  length?: string;
  format?: string;
  audience?: string;
  createdAt: number;
  updatedAt: number;
}

interface DatabaseSchema {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  drafts: Record<string, SyncedDraftRecord>;
}

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Safe file-based persistent store location
const DATA_DIR = path.resolve(process.cwd(), ".data");
const DB_FILE = path.resolve(DATA_DIR, "db_store.json");

function ensureStore(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Error reading db_store.json, creating clean store:", err);
  }

  const emptyStore: DatabaseSchema = {
    users: {},
    sessions: {},
    drafts: {},
  };
  saveStore(emptyStore);
  return emptyStore;
}

function saveStore(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write db_store.json:", err);
  }
}

// Password hashing using Node.js crypto scrypt
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const check = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(check, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export const db = {
  // User Management
  async createUser(email: string, password: string, name?: string): Promise<UserRecord> {
    const store = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();

    const exists = Object.values(store.users).some(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (exists) {
      throw new Error("An account with this email address already exists.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const id = `usr_${crypto.randomUUID()}`;
    const now = Date.now();

    const user: UserRecord = {
      id,
      email: normalizedEmail,
      passwordHash,
      salt,
      name: name?.trim() || normalizedEmail.split("@")[0],
      createdAt: now,
      updatedAt: now,
    };

    store.users[id] = user;
    saveStore(store);
    return user;
  },

  async authenticateUser(email: string, password: string): Promise<UserRecord> {
    const store = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();

    const user = Object.values(store.users).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const valid = verifyPassword(password, user.salt, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    return user;
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    const store = ensureStore();
    return store.users[id] || null;
  },

  // Session Management
  async createSession(userId: string): Promise<string> {
    const store = ensureStore();
    const token = crypto.randomBytes(32).toString("hex");
    const now = Date.now();

    store.sessions[token] = {
      id: token,
      userId,
      expiresAt: now + SESSION_TTL_MS,
      createdAt: now,
    };
    saveStore(store);
    return token;
  },

  async getSessionUser(token: string): Promise<UserRecord | null> {
    if (!token) return null;
    const store = ensureStore();
    const session = store.sessions[token];
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      delete store.sessions[token];
      saveStore(store);
      return null;
    }

    return store.users[session.userId] || null;
  },

  async deleteSession(token: string): Promise<void> {
    const store = ensureStore();
    if (store.sessions[token]) {
      delete store.sessions[token];
      saveStore(store);
    }
  },

  // Password Reset Management
  async createPasswordReset(email: string): Promise<string | null> {
    const store = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();
    const user = Object.values(store.users).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (!user) {
      return null; // Return null safely so we don't leak user existence
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + RESET_TOKEN_TTL_MS;
    user.updatedAt = Date.now();
    saveStore(store);
    return resetToken;
  },

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const store = ensureStore();
    const user = Object.values(store.users).find(
      (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now()
    );
    if (!user) {
      throw new Error("Invalid or expired password reset link.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    user.salt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    delete user.resetToken;
    delete user.resetTokenExpires;
    user.updatedAt = Date.now();

    // Invalidate any existing sessions for this user on password reset
    for (const [sessId, session] of Object.entries(store.sessions)) {
      if (session.userId === user.id) {
        delete store.sessions[sessId];
      }
    }

    saveStore(store);
    return true;
  },

  // Synced Drafts Management (Strict Per-User Ownership)
  async getDraftsForUser(userId: string): Promise<SyncedDraftRecord[]> {
    const store = ensureStore();
    return Object.values(store.drafts)
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async createDraft(
    userId: string,
    data: {
      title?: string;
      topic: string;
      post: string;
      hashtags?: string[];
      tone?: string;
      length?: string;
      format?: string;
      audience?: string;
    }
  ): Promise<SyncedDraftRecord> {
    const store = ensureStore();
    const id = `dft_${crypto.randomUUID()}`;
    const now = Date.now();

    const title = data.title?.trim() || data.topic.slice(0, 48) + (data.topic.length > 48 ? "..." : "");

    const draft: SyncedDraftRecord = {
      id,
      userId,
      title,
      topic: data.topic,
      post: data.post,
      hashtags: data.hashtags || [],
      tone: data.tone,
      length: data.length,
      format: data.format,
      audience: data.audience,
      createdAt: now,
      updatedAt: now,
    };

    store.drafts[id] = draft;
    saveStore(store);
    return draft;
  },

  async updateDraft(
    userId: string,
    draftId: string,
    data: Partial<Omit<SyncedDraftRecord, "id" | "userId" | "createdAt">>
  ): Promise<SyncedDraftRecord> {
    const store = ensureStore();
    const draft = store.drafts[draftId];

    if (!draft || draft.userId !== userId) {
      throw new Error("Draft not found or access denied.");
    }

    const updated: SyncedDraftRecord = {
      ...draft,
      ...data,
      title: data.title ? data.title.trim() : draft.title,
      updatedAt: Date.now(),
    };

    store.drafts[draftId] = updated;
    saveStore(store);
    return updated;
  },

  async deleteDraft(userId: string, draftId: string): Promise<void> {
    const store = ensureStore();
    const draft = store.drafts[draftId];

    if (!draft || draft.userId !== userId) {
      throw new Error("Draft not found or access denied.");
    }

    delete store.drafts[draftId];
    saveStore(store);
  },

  async importLocalDrafts(
    userId: string,
    drafts: Array<{
      title?: string;
      topic: string;
      post: string;
      hashtags?: string[];
      tone?: string;
      length?: string;
      format?: string;
      audience?: string;
    }>
  ): Promise<SyncedDraftRecord[]> {
    const store = ensureStore();
    const now = Date.now();
    const imported: SyncedDraftRecord[] = [];

    for (const item of drafts) {
      if (!item.post || !item.topic) continue;
      const id = `dft_${crypto.randomUUID()}`;
      const title = item.title?.trim() || item.topic.slice(0, 48) + (item.topic.length > 48 ? "..." : "");

      const draft: SyncedDraftRecord = {
        id,
        userId,
        title,
        topic: item.topic,
        post: item.post,
        hashtags: item.hashtags || [],
        tone: item.tone,
        length: item.length,
        format: item.format,
        audience: item.audience,
        createdAt: now,
        updatedAt: now,
      };

      store.drafts[id] = draft;
      imported.push(draft);
    }

    saveStore(store);
    return imported;
  },
};

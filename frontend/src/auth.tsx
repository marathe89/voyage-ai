import { createContext, useContext, useState, type ReactNode } from "react";

// Frontend-only mock auth. There is no real backend user database in this
// project (see backend/src/server.ts — it's a stateless Claude proxy), so
// this intentionally persists to localStorage instead of pretending to call
// a server. It's the one thing every page (Profile, nav, Checkout, Admin)
// now reads from, replacing the previously-disconnected per-page mock users.

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar: string;
  role: string;
}

export interface Role {
  id: string;
  name: string;
  isAdmin: boolean;
  builtIn?: boolean;
}

interface StoredAccount extends AuthUser {
  password: string;
}

const SESSION_KEY = "voyageai_auth_session";
const USERS_KEY = "voyageai_auth_users";
const ROLES_KEY = "voyageai_auth_roles";

const SEED_ACCOUNTS: StoredAccount[] = [
  { id: "u-arjun", name: "Arjun Mehta", email: "arjun.mehta@email.com", phone: "+91 98200 34512", location: "Mumbai, India", avatar: "/images/avatar-user.jpg", role: "user", password: "voyage123" },
  { id: "u-admin", name: "Voyage Admin", email: "admin@voyageai.com", phone: "", location: "San Francisco, USA", avatar: "/images/avatar-sarah.png", role: "admin", password: "admin123" },
];

const DEFAULT_ROLES: Role[] = [
  { id: "admin", name: "Admin", isAdmin: true, builtIn: true },
  { id: "user", name: "User", isAdmin: false, builtIn: true },
];

function loadRoles(): Role[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  saveRoles(DEFAULT_ROLES);
  return DEFAULT_ROLES;
}

function saveRoles(roles: Role[]) {
  try {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  } catch { /* storage unavailable — ignore */ }
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const stored: StoredAccount[] = JSON.parse(raw);
      // Guard against stale localStorage from an earlier version of this
      // app (or someone deleting the demo accounts in Admin) permanently
      // breaking the documented demo logins — always keep the seed
      // accounts present alongside whatever else has been added since.
      const missingSeeds = SEED_ACCOUNTS.filter((seed) => !stored.some((a) => a.id === seed.id || a.email.toLowerCase() === seed.email.toLowerCase()));
      if (missingSeeds.length) {
        const merged = [...stored, ...missingSeeds];
        saveAccounts(merged);
        return merged;
      }
      return stored;
    }
  } catch { /* ignore */ }
  saveAccounts(SEED_ACCOUNTS);
  return SEED_ACCOUNTS;
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
  } catch { /* storage unavailable — ignore */ }
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

interface AuthState {
  user: AuthUser | null;
  allUsers: AuthUser[];
  isAdmin: boolean;
  roles: Role[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (data: { name: string; email: string; password: string; phone?: string; location?: string }) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (partial: Partial<Omit<AuthUser, "id" | "role">>) => void;
  setUserRole: (userId: string, role: string) => void;
  createUser: (data: { name: string; email: string; password: string; role: string; phone?: string; location?: string }) => { ok: boolean; error?: string };
  updateUser: (userId: string, partial: Partial<Omit<AuthUser, "id">>) => { ok: boolean; error?: string };
  removeUser: (userId: string) => { ok: boolean; error?: string };
  addRole: (name: string, isAdmin: boolean) => { ok: boolean; error?: string };
  updateRole: (roleId: string, partial: Partial<Pick<Role, "name" | "isAdmin">>) => { ok: boolean; error?: string };
  removeRole: (roleId: string) => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<StoredAccount[]>(loadAccounts);
  const [user, setUser] = useState<AuthUser | null>(loadSession);
  const [roles, setRoles] = useState<Role[]>(loadRoles);

  function persistAccounts(next: StoredAccount[]) {
    setAccounts(next);
    saveAccounts(next);
  }

  function persistRoles(next: Role[]) {
    setRoles(next);
    saveRoles(next);
  }

  function login(email: string, password: string) {
    const match = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) return { ok: false, error: "No account found with that email." };
    if (match.password !== password) return { ok: false, error: "Incorrect password." };
    const { password: _pw, ...publicUser } = match;
    setUser(publicUser);
    saveSession(publicUser);
    return { ok: true };
  }

  function signup(data: { name: string; email: string; password: string; phone?: string; location?: string }) {
    if (accounts.some((a) => a.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const newAccount: StoredAccount = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone,
      location: data.location,
      avatar: "/images/avatar-user.jpg",
      role: "user",
      password: data.password,
    };
    persistAccounts([...accounts, newAccount]);
    const { password: _pw, ...publicUser } = newAccount;
    setUser(publicUser);
    saveSession(publicUser);
    return { ok: true };
  }

  function logout() {
    setUser(null);
    saveSession(null);
  }

  function updateProfile(partial: Partial<Omit<AuthUser, "id" | "role">>) {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      saveSession(next);
      persistAccounts(accounts.map((a) => (a.id === next.id ? { ...a, ...partial } : a)));
      return next;
    });
  }

  function setUserRole(userId: string, role: string) {
    persistAccounts(accounts.map((a) => (a.id === userId ? { ...a, role } : a)));
    setUser((prev) => (prev && prev.id === userId ? { ...prev, role } : prev));
  }

  function createUser(data: { name: string; email: string; password: string; role: string; phone?: string; location?: string }) {
    if (accounts.some((a) => a.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const newAccount: StoredAccount = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone,
      location: data.location,
      avatar: "/images/avatar-user.jpg",
      role: data.role,
      password: data.password,
    };
    persistAccounts([...accounts, newAccount]);
    return { ok: true };
  }

  function updateUser(userId: string, partial: Partial<Omit<AuthUser, "id">>) {
    if (partial.email && accounts.some((a) => a.id !== userId && a.email.toLowerCase() === partial.email!.trim().toLowerCase())) {
      return { ok: false, error: "Another account already uses that email." };
    }
    persistAccounts(accounts.map((a) => (a.id === userId ? { ...a, ...partial } : a)));
    setUser((prev) => (prev && prev.id === userId ? { ...prev, ...partial } : prev));
    return { ok: true };
  }

  function removeUser(userId: string) {
    if (user && user.id === userId) return { ok: false, error: "You can't remove the account you're signed in as." };
    persistAccounts(accounts.filter((a) => a.id !== userId));
    return { ok: true };
  }

  function addRole(name: string, isAdmin: boolean) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Role name can't be empty." };
    if (roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: "A role with that name already exists." };
    }
    const newRole: Role = { id: `r-${Date.now()}`, name: trimmed, isAdmin };
    persistRoles([...roles, newRole]);
    return { ok: true };
  }

  function updateRole(roleId: string, partial: Partial<Pick<Role, "name" | "isAdmin">>) {
    const target = roles.find((r) => r.id === roleId);
    if (!target) return { ok: false, error: "Role not found." };
    if (target.builtIn && partial.name && partial.name.trim() !== target.name) {
      return { ok: false, error: "Built-in role names can't be changed." };
    }
    persistRoles(roles.map((r) => (r.id === roleId ? { ...r, ...partial, name: partial.name?.trim() || r.name } : r)));
    return { ok: true };
  }

  function removeRole(roleId: string) {
    const target = roles.find((r) => r.id === roleId);
    if (!target) return { ok: false, error: "Role not found." };
    if (target.builtIn) return { ok: false, error: "Built-in roles can't be deleted." };
    if (accounts.some((a) => a.role === roleId)) {
      return { ok: false, error: "Reassign users off this role before deleting it." };
    }
    persistRoles(roles.filter((r) => r.id !== roleId));
    return { ok: true };
  }

  const allUsers = accounts.map(({ password: _pw, ...u }) => u);
  const isAdmin = !!user && !!roles.find((r) => r.id === user.role)?.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        isAdmin,
        roles,
        login,
        signup,
        logout,
        updateProfile,
        setUserRole,
        createUser,
        updateUser,
        removeUser,
        addRole,
        updateRole,
        removeRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

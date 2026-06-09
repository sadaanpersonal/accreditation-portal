"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  saveTokens,
  loadTokens,
  clearTokens,
  type UserInfo,
  type TokenResponse,
} from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user:          UserInfo | null;
  isLoading:     boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login:  (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole:       (role: string | string[]) => boolean;
}

// ── Roles (mirrors Core/Constants/Roles.cs) ──────────────────────────────────
export const Roles = {
  SuperAdmin: "SUPER_ADMIN",
  FAOwner:    "FA_OWNER",
  ZoneOwner:  "ZONE_OWNER",
  MediaOwner: "MEDIA_OWNER",
  MoiOfficer: "MOI_OFFICER",
  Requestor:  "REQUESTOR",
  Accredited: "ACCREDITED",
} as const;

export type RoleCode = typeof Roles[keyof typeof Roles];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Decode the JWT payload (no signature verification — server already did that). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Extract UserInfo from a raw JWT access token (fallback if server doesn't provide userInfo). */
function userInfoFromToken(token: string): UserInfo | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id:          (payload["nameid"] ?? payload["sub"] ?? "") as string,
    userName:    (payload["unique_name"] ?? "") as string,
    firstName:   (payload["given_name"]  ?? "") as string,
    lastName:    (payload["family_name"] ?? "") as string,
    email:       (payload["email"] ?? "") as string,
    role:        (payload["role"] ?? "") as string,
    roleId:      "" as string,
    roleCode:    (payload["role"] ?? "") as string,
    permissions: (() => {
      const p = payload["permission"];
      if (Array.isArray(p)) return p as string[];
      if (typeof p === "string") return [p];
      return [];
    })(),
  };
}

const USER_KEY = "qoc_user";

function saveUser(u: UserInfo) {
  if (typeof window !== "undefined")
    localStorage.setItem(USER_KEY, JSON.stringify(u));
}

function loadUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearUser() {
  if (typeof window !== "undefined")
    localStorage.removeItem(USER_KEY);
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user:            null,
    isLoading:       true,
    isAuthenticated: false,
  });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const tokens = loadTokens();
    const user   = loadUser();

    if (tokens?.accessToken && user) {
      // Basic expiry check
      const payload = decodeJwtPayload(tokens.accessToken);
      const exp     = payload?.["exp"] as number | undefined;
      if (exp && Date.now() / 1000 > exp) {
        clearTokens();
        clearUser();
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Stale-token guard: admin/reviewer roles should always have permissions.
      // If the stored user object has no permissions (e.g. token was issued before
      // permission claims were added), try to recover them from the JWT payload.
      // If the JWT also has no permission claims, force re-login.
      const adminRoles: string[] = [
        Roles.SuperAdmin, Roles.FAOwner, Roles.ZoneOwner,
        Roles.MediaOwner, Roles.MoiOfficer,
      ];
      const storedRole = user.roleCode ?? user.role ?? "";
      if (adminRoles.includes(storedRole) && !(user.permissions?.length)) {
        const jwtPerms = (() => {
          const p = payload?.["permission"];
          if (Array.isArray(p)) return p as string[];
          if (typeof p === "string") return [p];
          return [] as string[];
        })();

        if (jwtPerms.length === 0) {
          // JWT has no permission claims — stale token; force re-login
          clearTokens();
          clearUser();
          setState({ user: null, isLoading: false, isAuthenticated: false });
          return;
        }
        // Patch cached user with permissions recovered from JWT
        const patched = { ...user, permissions: jwtPerms };
        saveUser(patched);
        setState({ user: patched, isLoading: false, isAuthenticated: true });
        return;
      }

      setState({ user, isLoading: false, isAuthenticated: true });
    } else {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      const res = await authApi.login(email, password);

      if (!res.success || !res.data) {
        return { success: false, message: res.message ?? res.errors?.[0] ?? "Login failed." };
      }

      const tokenData: TokenResponse = res.data;
      saveTokens({ accessToken: tokenData.accessToken, refreshToken: tokenData.refreshToken });

      // 1. Prefer server-provided userInfo (new backend: property is "userInfo")
      // 2. Fall back to raw "user" property (old backend before rename)
      // 3. Last resort: decode from the JWT payload itself
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = res.data as any;
      const user =
        tokenData.userInfo ??
        (rawData.user as UserInfo | undefined) ??
        userInfoFromToken(tokenData.accessToken);

      if (!user) return { success: false, message: "Could not parse user info." };

      saveUser(user);
      setState({ user, isLoading: false, isAuthenticated: true });

      // Route by role code (e.g. "SUPER_ADMIN", "FA_OWNER", "REQUESTOR")
      const role = user.roleCode ?? user.role ?? "";
      if (role === Roles.SuperAdmin || role === Roles.FAOwner || role === Roles.ZoneOwner
          || role === Roles.MediaOwner || role === Roles.MoiOfficer) {
        router.push("/admin");
      } else if (role === Roles.Requestor) {
        router.push("/requestor");
      } else if (role === Roles.Accredited) {
        router.push("/accredited");
      } else {
        // Unknown role — send to login so the user can see what's happening
        router.push("/login");
      }

      return { success: true, message: "Login successful." };
    },
    [router],
  );

  const logout = useCallback(async () => {
    const tokens = loadTokens();
    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch {
        // best-effort
      }
    }
    clearTokens();
    clearUser();
    setState({ user: null, isLoading: false, isAuthenticated: false });
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback(
    (permission: string): boolean =>
      state.user?.permissions?.includes(permission) ?? false,
    [state.user],
  );

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!state.user) return false;
      const userRole = state.user.roleCode ?? state.user.role;
      return Array.isArray(role) ? role?.includes(userRole) : userRole === role;
    },
    [state.user],
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

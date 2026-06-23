import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api, { csrfCookie } from "@/lib/api";

interface User {
  id: number;
  uid: string;
  name: string;
  email: string;
  mobile_no: string | null;
  onboarding_status: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  verifyOtp: (uid: string, code: string) => Promise<void>;
  verifyEmail: (uid: string, token: string) => Promise<void>;
  resendLoginOtp: (uid: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, password: string, passwordConfirmation: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface LoginResult {
  requires_otp?: boolean;
  requires_email_verification?: boolean;
  uid?: string;
  message: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setUser = useCallback((user: User) => {
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/user");
      setUser(response.data);
    } catch {
      clearAuth();
    }
  }, [setUser, clearAuth]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      await csrfCookie();
      const response = await api.post("/login", { email, password });
      return response.data;
    },
    []
  );

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    await csrfCookie();
    await api.post("/register", data);
  }, []);

  const verifyOtp = useCallback(
    async (uid: string, code: string): Promise<void> => {
      await csrfCookie();
      await api.post("/verify-otp", { uid, code });

      // Session cookie is now set by the server — load the user
      await refreshUser();
    },
    [refreshUser]
  );

  const verifyEmail = useCallback(
    async (uid: string, token: string): Promise<void> => {
      await csrfCookie();
      const response = await api.post("/verify-email", { uid, token });
      return response.data;
    },
    []
  );

  const resendLoginOtp = useCallback(async (uid: string): Promise<void> => {
    await csrfCookie();
    await api.post("/resend-login-otp", { uid });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    await csrfCookie();
    await api.post("/forgot-password", { email });
  }, []);

  const resendVerificationEmail = useCallback(async (email: string): Promise<void> => {
    await csrfCookie();
    await api.post("/resend-verification-email", { email });
  }, []);

  const resetPassword = useCallback(
    async (
      email: string,
      token: string,
      password: string,
      passwordConfirmation: string
    ): Promise<void> => {
      await csrfCookie();
      await api.post("/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verifyOtp,
        verifyEmail,
        resendLoginOtp,
        forgotPassword,
        resetPassword,
        resendVerificationEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

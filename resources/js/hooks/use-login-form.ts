import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export function useLoginForm() {
  const { login, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();

  // Clean up cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    setRequiresEmailVerification(null);
    setResendMessage(null);
    try {
      const result = await login(data.email, data.password);

      if (result.requires_otp) {
        navigate(`/verify-otp?uid=${result.uid}`);
        return;
      }

      if (result.requires_email_verification) {
        setRequiresEmailVerification(data.email);
        return;
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const message =
          err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          "Login failed. Please try again.";
        setServerError(message);
      } else {
        setServerError("Network error. Please try again.");
      }
    }
  }

  async function handleResend() {
    if (!requiresEmailVerification || resendCooldown > 0) return;

    setResendMessage(null);
    setServerError(null);

    try {
      await resendVerificationEmail(requiresEmailVerification);
      setResendMessage("A new verification link has been sent to your email.");
      startCooldown();
    } catch {
      setServerError("Failed to resend verification email. Please try again.");
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    requiresEmailVerification,
    resendMessage,
    resendCooldown,
    handleResend,
  };
}

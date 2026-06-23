import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function useRegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    try {
      await registerUser(data);
      navigate("/verify-email/sent", { state: { email: data.email } });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const errors = err.response?.data?.errors;
        const message =
          err.response?.data?.message || "Registration failed. Please try again.";

        if (errors) {
          // Set individual field errors
          for (const [field, msgs] of Object.entries(errors)) {
            if (msgs.length > 0) {
              form.setError(field as keyof RegisterFormData, {
                message: msgs[0],
              });
            }
          }
        } else {
          setServerError(message);
        }
      } else {
        setServerError("Network error. Please try again.");
      }
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    serverError,
  };
}

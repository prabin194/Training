import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must be 255 characters or less"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  })
  .refine(
    (data) => {
      if (!data.name) return true;
      const nameLower = data.name.toLowerCase();
      const passwordLower = data.password.toLowerCase();
      return !passwordLower.includes(nameLower);
    },
    {
      message: "Password must not contain your name",
      path: ["password"],
    },
  );

export type RegisterFormData = z.infer<typeof registerSchema>;

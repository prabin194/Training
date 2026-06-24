import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailSentPage() {
  const location = useLocation();
  const { resendVerificationEmail } = useAuth();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = useState(emailFromState);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    cooldownRef.current = interval;
  };

  async function handleResend() {
    if (!email || isResending || resendCooldown > 0) return;

    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      await resendVerificationEmail(email);
      setResendMessage("A new verification link has been sent to your email.");
      startCooldown();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setResendError(
        err.response?.data?.message || "Failed to resend verification email. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Mail className="size-12 text-primary" />
            <CardDescription>
              We've sent a verification link to your email address.
              Please check your inbox and click the link to verify your account.
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              The link will expire in 60 minutes.
            </p>

            <FieldGroup>
              {resendMessage && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{resendMessage}</span>
                </div>
              )}
              {resendError && (
                <Field>
                  <FieldError>{resendError}</FieldError>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="resend-email">Email address</FieldLabel>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={isResending || !email || resendCooldown > 0}
                onClick={handleResend}
                className="w-full"
              >
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend verification email"}
              </Button>
            </FieldGroup>

            <Button asChild variant="ghost" className="mt-2">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

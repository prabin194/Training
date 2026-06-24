import { useState, useRef, useEffect, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp, resendLoginOtp, isAuthenticated } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uid = searchParams.get("uid");

  // Clean up cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

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

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newCode = [...code];
      for (let i = 0; i < digits.length; i++) {
        newCode[i] = digits[i];
      }
      setCode(newCode);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && index > 0 && !code[index]) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = code.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (!uid) {
      setError("Missing verification ID. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(uid, otpCode);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Invalid or expired code.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!uid || isResending || resendCooldown > 0) return;

    setIsResending(true);
    setResendMessage(null);
    setError(null);

    try {
      await resendLoginOtp(uid);
      setResendMessage("A new verification code has been sent to your email.");
      startCooldown();
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!uid) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Invalid verification session. Please log in again.</p>
            <Button asChild className="mt-4">
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Shield className="size-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Verification Code</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Code</FieldLabel>
                  <div className="flex gap-2 justify-center">
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-12 text-center text-lg font-mono"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  {error && <FieldError>{error}</FieldError>}
                </Field>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="mt-2 flex flex-col items-center gap-2">
                  {resendMessage && (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{resendMessage}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                  >
                    {isResending
                      ? "Sending..."
                      : resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Didn't receive the code? Resend"}
                  </button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

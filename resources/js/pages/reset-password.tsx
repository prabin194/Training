import { useState, type FormEvent } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { GalleryVerticalEnd, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <XCircle className="size-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">Invalid reset link. Missing parameters.</p>
            <Button asChild className="mt-4">
              <Link to="/forgot-password">Request New Reset Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email, token, password, passwordConfirmation);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Reset failed. The link may be expired.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-medium mb-2">Password reset successfully!</p>
            <p className="text-sm text-muted-foreground mb-4">You can now log in with your new password.</p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <FieldDescription>
                    Must include uppercase, lowercase, and a number.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password_confirmation">Confirm Password</FieldLabel>
                  <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="Repeat your password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                </Field>
                {error && (
                  <Field>
                    <FieldError>{error}</FieldError>
                  </Field>
                )}
                <Field>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

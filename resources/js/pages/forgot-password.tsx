import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { GalleryVerticalEnd, Loader2, Mail } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsSent(true);
    } catch {
      // Don't reveal if email exists
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
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
                If an account exists with that email, we've sent a password reset link.
                Please check your inbox.
              </CardDescription>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
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
            <CardTitle className="text-xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {error && <FieldError>{error}</FieldError>}
                </Field>
                <Field>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                      Log in
                    </Link>
                  </p>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

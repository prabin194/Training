import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!uid || !token) {
      setStatus("error");
      setMessage("Invalid verification link. Missing parameters.");
      return;
    }

    verifyEmail(uid, token)
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
      })
      .catch((error: unknown) => {
        setStatus("error");
        if (error && typeof error === "object" && "response" in error) {
          const err = error as { response?: { data?: { message?: string } } };
          setMessage(err.response?.data?.message || "Verification failed. The link may be expired.");
        } else {
          setMessage("Verification failed. The link may be expired.");
        }
      });
  }, [uid, token, verifyEmail]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="size-12 animate-spin text-primary" />
                <CardDescription>Verifying your email address...</CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="size-12 text-green-500" />
                <p className="text-sm text-green-600 font-medium">{message}</p>
                <Button asChild className="mt-2">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="size-12 text-destructive" />
                <p className="text-sm text-destructive font-medium">{message}</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/login">Back to Login</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

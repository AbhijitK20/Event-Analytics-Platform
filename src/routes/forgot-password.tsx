import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/features/auth/use-auth-user";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Kamel Ride" },
      {
        name: "description",
        content: "Reset your Kamel Ride account password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthUser();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error("Failed to send reset email", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Check your email for a password reset link");
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-gradient-to-br from-cyan-500/8 to-transparent rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[250px] bg-gradient-to-tl from-violet-500/6 to-transparent rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-scale">
        <Card className="panel-surface overflow-hidden border-white/5">
          <div className="h-1 bg-gradient-to-r from-cyan-500/60 via-teal-400 to-emerald-500/60" />

          <CardHeader className="text-center pt-8 pb-4">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-teal-500/10 text-cyan-400 border border-cyan-500/10 mb-3 shadow-lg shadow-cyan-500/10">
              <Mail className="size-5" />
            </span>
            <CardTitle className="text-xl font-bold tracking-tight">
              {sent ? "Check your email" : "Forgot password?"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {sent
                ? `We sent a password reset link to ${email}`
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-8 pb-8">
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="you@company.com"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <Button
                  className="w-full h-11 gap-2 font-medium"
                  disabled={busy}
                  onClick={handleSubmit}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Send reset link
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm">
              <ArrowLeft className="size-3.5" />
              <Link
                to="/auth"
                className="text-muted-foreground/70 hover:text-primary transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Kamel Ride" },
      {
        name: "description",
        content: "Set your new Kamel Ride account password.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Extract tokens from URL hash and set session
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type === "recovery" && accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setSessionError(error.message);
          } else {
            setSessionReady(true);
          }
        });
    } else {
      setSessionError("Invalid or expired reset link. Please request a new one.");
    }

    // Clean up the URL hash
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const handleSubmit = async () => {
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error("Failed to reset password", { description: error.message });
      return;
    }

    setSuccess(true);
    toast.success("Password updated successfully!");
    setTimeout(() => navigate({ to: "/dashboard", replace: true }), 2000);
  };

  if (sessionError) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center px-4">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-gradient-to-br from-cyan-500/8 to-transparent rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl" />
        </div>
        <div className="w-full max-w-md animate-fade-in-scale">
          <Card className="panel-surface overflow-hidden border-white/5">
            <div className="h-1 bg-gradient-to-r from-rose-500/60 via-rose-400 to-rose-500/60" />
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight">Invalid reset link</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {sessionError}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <a
                href="/forgot-password"
                className="block w-full h-11 rounded-md bg-primary text-primary-foreground text-center leading-[44px] text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Request new link
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center px-4">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {success ? <CheckCircle2 className="size-5" /> : <KeyRound className="size-5" />}
            </span>
            <CardTitle className="text-xl font-bold tracking-tight">
              {success ? "Password updated" : "Set new password"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {success
                ? "Redirecting you to the dashboard..."
                : "Choose a strong password for your account."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-8 pb-8">
            {!success && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    New password
                  </Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Confirm password
                  </Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="••••••••"
                      className="pl-10 h-11"
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                </div>
                <Button
                  className="w-full h-11 gap-2 font-medium"
                  disabled={busy || !password || !confirmPassword}
                  onClick={handleSubmit}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  Reset password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, ArrowRight, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/features/auth/use-auth-user";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Kamel Ride Event Analytics" },
      {
        name: "description",
        content: "Sign in with Google to access the Kamel Ride realtime event analytics dashboard.",
      },
      { property: "og:title", content: "Sign in — Kamel Ride Event Analytics" },
      { property: "og:description", content: "Access the Kamel Ride analytics dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const withGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in failed", { description: error.message });
    }
  };

  const withPassword = async (mode: "signin" | "signup") => {
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email: email.trim(), password })
        : supabase.auth.signUp({
            email: email.trim(),
            password,
          });
    const { data, error } = await fn;
    setBusy(false);
    if (error) {
      console.error("[Auth]", mode, "error:", error, "data:", data);
      const msg = error.message || JSON.stringify(error) || "Unknown error";
      toast.error(mode === "signin" ? "Sign-in failed" : "Sign-up failed", {
        description: String(msg),
      });
      return;
    }
    if (mode === "signup" && !data.session) {
      toast.success("Check your email to confirm your account", {
        description:
          "You can also disable email confirmation in your Supabase dashboard under Authentication > Settings.",
      });
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4">
      {/* Background — organic blobs, not perfect circles */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-gradient-to-br from-cyan-500/8 to-transparent rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[250px] bg-gradient-to-tl from-violet-500/6 to-transparent rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-scale">
        <Card className="panel-surface overflow-hidden border-white/5">
          {/* Gradient accent bar — not uniform */}
          <div className="h-1 bg-gradient-to-r from-cyan-500/60 via-teal-400 to-emerald-500/60" />

          <CardHeader className="text-center pt-8 pb-4">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-teal-500/10 text-cyan-400 border border-cyan-500/10 mb-3 shadow-lg shadow-cyan-500/10">
              <Activity className="size-5" />
            </span>
            <CardTitle className="text-xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to access the event analytics dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-8 pb-8">
            {/* Google Sign In — styled like Nodus */}
            <Button
              className="w-full h-11 gap-2.5 font-medium bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground animate-fade-in-up"
              size="lg"
              disabled={busy}
              onClick={withGoogle}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground animate-fade-in-up stagger-1">
              <span className="h-px flex-1 bg-border/60" />
              <span className="font-medium uppercase tracking-widest text-[10px]">or</span>
              <span className="h-px flex-1 bg-border/60" />
            </div>

            {/* Email/Password Form */}
            <div className="space-y-3.5 animate-fade-in-up stagger-2">
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
                    placeholder="you@company.com"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground/70 hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="flex gap-2.5 pt-1">
                <Button
                  variant="secondary"
                  className="flex-1 h-11 gap-2 font-medium"
                  disabled={busy}
                  onClick={() => withPassword("signin")}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                  Sign in
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 font-medium"
                  disabled={busy}
                  onClick={() => withPassword("signup")}
                >
                  Create account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, BarChart3, Radio, Zap, ArrowRight, Globe, Shield, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthUser } from "@/features/auth/use-auth-user";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kamel Ride — Realtime Event Analytics Platform" },
      {
        name: "description",
        content:
          "Ingest, simulate and visualize ride events in realtime. An internal engineering analytics dashboard for the Kamel platform.",
      },
      { property: "og:title", content: "Kamel Ride — Realtime Event Analytics Platform" },
      {
        property: "og:description",
        content: "Ingest, simulate and visualize ride events in realtime.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Zap,
    title: "Single ingestion path",
    body: "Every event — manual or simulated — flows through one typed function into Postgres. No orphans, no duplicates.",
    accent: "from-amber-500/15 to-orange-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Radio,
    title: "Realtime by default",
    body: "Postgres change streams push new rows straight into the dashboard. Zero polling, zero refresh.",
    accent: "from-emerald-500/15 to-teal-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Operational analytics",
    body: "Volume trends, completion rates, average fare, top users and cities — across any time range.",
    accent: "from-violet-500/15 to-purple-500/5",
    iconColor: "text-violet-400",
  },
];

const STATS = [
  { label: "Event types", value: 8, suffix: "" },
  { label: "Cities tracked", value: 6, suffix: "" },
  { label: "Avg latency", value: 120, suffix: "ms" },
  { label: "Uptime", value: 99.9, suffix: "%" },
];

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Number((eased * target).toFixed(target % 1 !== 0 ? 1 : 0)));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center px-4 py-3">
      <p className="text-3xl font-bold tracking-tight tabular-nums">
        {count}
        <span className="text-primary">{suffix}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

function Landing() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="relative overflow-hidden px-4 sm:px-6 py-8">
      {/* Hero Gradient Background — organic, not perfect circles */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/4 w-[500px] h-[400px] bg-gradient-to-br from-cyan-500/8 to-transparent rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl animate-drift" />
        <div
          className="absolute top-40 -right-20 w-[350px] h-[350px] bg-gradient-to-bl from-violet-500/6 to-transparent rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl animate-drift"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute top-80 left-0 w-[250px] h-[250px] bg-gradient-to-tr from-amber-500/5 to-transparent rounded-[50%_50%_30%_70%/60%_40%_60%_40%] blur-3xl animate-drift"
          style={{ animationDelay: "-10s" }}
        />
      </div>

      <div className="space-y-20 py-12">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          {/* Badge with hand-drawn feel */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-cyan-400 animate-fade-in-up backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Event analytics for ride operations
          </span>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up stagger-1 leading-[1.08]">
            Every ride event, visible{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              the moment it happens.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground leading-relaxed animate-fade-in-up stagger-2">
            Kamel Ride is an internal engineering dashboard: simulate ride lifecycle events, stream
            them into Postgres, and watch analytics update live.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in-up stagger-3">
            <Button
              asChild
              size="lg"
              className="gap-2 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 border-0 animate-pulse-glow"
              style={{ animationDuration: "3s" }}
            >
              <Link to="/auth">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 px-6 border-white/10 hover:bg-white/5"
            >
              <a
                href="https://github.com/AbhijitK20/Event-Analytics-Platform"
                target="_blank"
                rel="noreferrer"
              >
                View source
              </a>
            </Button>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="mx-auto max-w-2xl animate-fade-in-up stagger-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm divide-x divide-border/30">
            {STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* Features — varied card styles, not uniform */}
        <section className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              className={`panel-surface glow-hover group relative overflow-hidden animate-fade-in-up stagger-${i + 1} ${
                i === 1 ? "md:translate-y-4" : i === 2 ? "md:translate-y-8" : ""
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${f.accent} pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500`}
              />
              {/* Hand-drawn style accent line */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <CardContent className="relative space-y-4 p-7">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm border border-white/10 ${f.iconColor} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <f.icon className="size-6" />
                </span>
                <h2 className="text-lg font-bold tracking-tight">{f.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="text-center animate-fade-in-up">
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Globe className="size-4" />
              <Shield className="size-4" />
              <Clock className="size-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              Built with React, TanStack, Supabase, and Recharts. Open source and ready for
              production.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

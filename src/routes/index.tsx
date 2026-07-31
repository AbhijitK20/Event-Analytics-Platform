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
        if (entry.isIntersecting && !started.current) {
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
    <div className="relative overflow-hidden">
      {/* Hero Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-chart-2/6 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-gradient-to-br from-chart-4/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="space-y-20 py-12">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary animate-fade-in-up">
            <Activity className="size-3.5" /> Event analytics for ride operations
          </span>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up stagger-1 leading-[1.1]">
            Every ride event, visible <span className="text-primary">the moment it happens.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground leading-relaxed animate-fade-in-up stagger-2">
            Kamel Ride is an internal engineering dashboard: simulate ride lifecycle events, stream
            them into Postgres, and watch analytics update live.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in-up stagger-3">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link to="/auth">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 px-6">
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

        {/* Features */}
        <section className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              className={`panel-surface glow-hover group relative overflow-hidden animate-fade-in-up stagger-${i + 1}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${f.accent} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
              />
              <CardContent className="relative space-y-4 p-7">
                <span
                  className={`flex size-11 items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm border border-border/30 ${f.iconColor}`}
                >
                  <f.icon className="size-5" />
                </span>
                <h2 className="text-base font-semibold">{f.title}</h2>
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

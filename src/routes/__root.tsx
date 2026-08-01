import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, BarChart3, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from "lucide-react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/features/auth/use-auth-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sentry } from "@/integrations/sentry";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-in-scale">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-in-scale">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kamel Ride Event Analytics Platform" },
      {
        name: "description",
        content: "Real-time ride event ingestion, simulation and analytics for the Kamel platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('kamel-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background text-foreground">
          <AppLayout />
          <Toaster position="top-right" />
        </div>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/simulator", label: "Simulator", icon: BarChart3 },
] as const;

function AppLayout() {
  const { user, profile } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  // Unauthenticated: simple header layout
  if (!user) {
    return (
      <>
        <HeaderSimple />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </>
    );
  }

  // Authenticated: sidebar layout
  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar — Nodus-style icon nav */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[72px] lg:border-r lg:border-white/5 lg:bg-[#0a0f1a]/90 lg:backdrop-blur-xl fixed inset-y-0 left-0 z-30"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-center py-5 border-b border-white/5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Activity className="size-5" />
          </span>
        </div>

        {/* Nav Items — icon only */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group relative flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-white/5 hover:text-foreground"
              activeProps={{
                className: "bg-cyan-500/10 text-cyan-400",
              }}
              activeOptions={{ exact: true }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-cyan-400" />
                  )}
                  <item.icon className="size-5" />
                  <span className="absolute left-full ml-3 rounded-lg bg-white/10 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-white/5 px-3 py-3 flex flex-col items-center gap-2">
          <ThemeToggle />
          <Avatar className="size-8 ring-2 ring-white/10">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback className="text-[10px] bg-cyan-500/15 text-cyan-400">
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={signOut}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Activity className="size-4" />
            </span>
            <span className="text-sm font-semibold">Kamel Ride</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="size-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {/* Mobile Nav Dropdown */}
        {mobileOpen && (
          <div className="border-t border-border/30 bg-background/95 backdrop-blur px-3 py-2 animate-fade-in-up">
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={<item.icon className="size-4" />}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <div className="border-t border-border/30 mt-2 pt-2">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-[72px] pt-16 lg:pt-0">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link
      to={to}
      className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-accent/50 hover:text-foreground"
      activeProps={{
        className: "bg-primary/10 text-primary",
      }}
      activeOptions={{ exact: true }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
          )}
          {icon}
          {label}
        </>
      )}
    </Link>
  );
}

function MobileNavLink({
  to,
  label,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      activeProps={{
        className: "bg-primary/10 text-primary",
      }}
      activeOptions={{ exact: true }}
    >
      {icon}
      {label}
    </Link>
  );
}

function HeaderSimple() {
  const { user } = useAuthUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Activity className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">Kamel Ride</span>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-widest">
              Analytics
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {!user && (
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

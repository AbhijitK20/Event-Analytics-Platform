import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, History, RotateCcw, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ingestEvents, type NewEvent } from "@/lib/events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — Kamel Ride Event Analytics" },
      {
        name: "description",
        content: "View and replay audit log entries for all ingested ride events.",
      },
      { property: "og:title", content: "Audit Log — Kamel Ride Event Analytics" },
      {
        property: "og:description",
        content: "View and replay audit log entries for all ingested ride events.",
      },
    ],
  }),
  component: AuditLog,
});

type AuditEntry = {
  id: string;
  event_id: string;
  action: "insert" | "delete";
  event_type: string | null;
  user_id: string | null;
  owner_id: string;
  snapshot: Record<string, unknown> | null;
  created_at: string;
};

type FilterAction = "all" | "insert" | "delete";

async function fetchAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabaseAny
    .from("event_audit_log")
    .select("id, event_id, action, event_type, user_id, owner_id, snapshot, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditEntry[];
}

function AuditLog() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<FilterAction>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const auditQuery = useQuery({
    queryKey: ["audit-log"],
    queryFn: fetchAuditLog,
    staleTime: 30_000,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  const replayMutation = useMutation({
    mutationFn: (entry: AuditEntry) => {
      const snapshot = (entry.snapshot ?? {}) as Record<string, string>;
      const event: NewEvent = {
        event_type: String(snapshot.event_type ?? entry.event_type ?? "unknown"),
        user_id: String(snapshot.user_id ?? entry.user_id ?? "unknown"),
        metadata: entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : undefined,
      };
      return ingestEvents([event]);
    },
    onSuccess: () => {
      toast.success("Event replayed successfully");
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: Error) => {
      toast.error(`Replay failed: ${err.message}`);
    },
  });

  const entries = useMemo(() => auditQuery.data ?? [], [auditQuery.data]);

  const filtered = useMemo(() => {
    let result = entries;
    if (actionFilter !== "all") {
      result = result.filter((e) => e.action === actionFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((e) =>
        `${e.event_type ?? ""} ${e.user_id ?? ""} ${e.event_id} ${e.action}`
          .toLowerCase()
          .includes(q),
      );
    }
    return result;
  }, [entries, actionFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const insertCount = entries.filter((e) => e.action === "insert").length;
  const deleteCount = entries.filter((e) => e.action === "delete").length;

  const loading = auditQuery.isLoading;

  if (auditQuery.isError) {
    return (
      <div className="space-y-6 gradient-mesh min-h-screen -mx-6 -my-8 px-6 py-8">
        <Card className="panel-surface border-destructive/40 animate-fade-in-scale">
          <CardHeader>
            <CardTitle className="text-destructive">Couldn't load audit log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{(auditQuery.error as Error).message}</p>
            <Button variant="outline" size="sm" onClick={() => auditQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 gradient-mesh min-h-screen -mx-6 -my-8 px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track insertions and deletions across your ride events.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up stagger-1">
        <Card className="panel-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? <Skeleton className="h-8 w-16 inline-block" /> : entries.length}
            </div>
          </CardContent>
        </Card>
        <Card className="panel-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plus className="size-3.5 text-emerald-400" />
              Inserts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-400">
              {loading ? <Skeleton className="h-8 w-16 inline-block" /> : insertCount}
            </div>
          </CardContent>
        </Card>
        <Card className="panel-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trash2 className="size-3.5 text-rose-400" />
              Deletes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-rose-400">
              {loading ? <Skeleton className="h-8 w-16 inline-block" /> : deleteCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="panel-surface animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Audit Entries
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search audit log..."
                  className="pl-9 h-9 w-56 bg-muted/30"
                />
              </div>
              <div className="relative flex rounded-xl border border-border/60 bg-muted/30 p-1">
                {(["all", "insert", "delete"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setActionFilter(a);
                      setPage(0);
                    }}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 z-10 capitalize ${
                      actionFilter === a
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a}
                  </button>
                ))}
                <span
                  className="absolute top-1 bottom-1 rounded-lg bg-primary/15 shadow-sm transition-all duration-300 ease-out"
                  style={{
                    left: `calc(${(["all", "insert", "delete"] as const).indexOf(actionFilter) * (100 / 3)}% + 4px)`,
                    width: `calc(${100 / 3}% - 8px)`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <History className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search || actionFilter !== "all"
                  ? "No audit entries match your filters"
                  : "No audit entries yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                        Action
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                        Event Type
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                        User
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                        Event ID
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground text-right">
                        Replay
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="group border-border/30 transition-colors hover:bg-primary/[0.03]"
                      >
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono tabular-nums">
                          {new Date(entry.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold border ${
                              entry.action === "insert"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {entry.action === "insert" ? (
                              <Plus className="size-2.5 mr-1" />
                            ) : (
                              <Trash2 className="size-2.5 mr-1" />
                            )}
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.event_type ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {entry.user_id ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                          {entry.event_id}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            disabled={replayMutation.isPending}
                            onClick={() => replayMutation.mutate(entry)}
                          >
                            <RotateCcw className="size-3" />
                            Replay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-4">
                <span className="tabular-nums">
                  Page {current + 1} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={current === 0}
                    onClick={() => setPage(current - 1)}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={current >= pageCount - 1}
                    onClick={() => setPage(current + 1)}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

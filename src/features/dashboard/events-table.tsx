import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./components";
import { formatType } from "./use-analytics";
import { EVENT_COLORS, type RideEvent } from "@/lib/events";

type SortKey = "created_at" | "event_type" | "user_id";
const PAGE_SIZE = 10;

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const entries = Object.entries(metadata).slice(0, 3);
  const extra = Object.keys(metadata).length - 3;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {entries.map(([key, val]) => (
        <span key={key} className="text-xs">
          <span className="text-muted-foreground">{key}:</span>{" "}
          <span className="font-medium text-foreground/80">
            {typeof val === "object" ? JSON.stringify(val) : String(val)}
          </span>
        </span>
      ))}
      {extra > 0 && <span className="text-xs text-muted-foreground">+{extra} more</span>}
    </div>
  );
}

export function EventsTable({ events, loading }: { events: RideEvent[]; loading: boolean }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? events.filter((e) =>
          `${e.event_type} ${e.user_id} ${JSON.stringify(e.metadata ?? {})}`
            .toLowerCase()
            .includes(q),
        )
      : events;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey]);
      const bv = String(b[sortKey]);
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [events, query, sortKey, asc]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(false);
    }
    setPage(0);
  };

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        {label}
        {sortKey === k ? (
          asc ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : null}
      </button>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const exportCsv = () => {
    const headers = ["Timestamp", "Event Type", "User ID", "City", "Fare", "Vehicle"];
    const csvRows = rows.map((e) => {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      return [
        new Date(e.created_at).toISOString(),
        e.event_type,
        e.user_id,
        String(meta.city ?? ""),
        String(meta.fare ?? ""),
        String(meta.vehicle_type ?? ""),
      ];
    });
    const csv = [headers, ...csvRows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kamel-ride-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search events..."
            className="pl-9 h-9 bg-muted/30"
          />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {rows.length} event{rows.length === 1 ? "" : "s"}
          </span>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportCsv}>
              <Download className="size-3" /> CSV
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState message={query ? "No events match your search" : "No events in this range"} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortHead label="Time" k="created_at" />
                  <SortHead label="Event" k="event_type" />
                  <SortHead label="User" k="user_id" />
                  <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((e) => (
                  <TableRow
                    key={e.id}
                    className="group border-border/30 transition-colors hover:bg-primary/[0.03]"
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono tabular-nums">
                      {new Date(e.created_at).toLocaleString(undefined, {
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
                        className={`text-[10px] font-semibold border ${EVENT_COLORS[e.event_type]?.badge ?? "bg-secondary/50 text-secondary-foreground"}`}
                      >
                        {formatType(e.event_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {e.user_id}
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <MetadataDisplay metadata={e.metadata} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
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
    </div>
  );
}

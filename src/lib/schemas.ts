import { z } from "zod";
import { EVENT_TYPES } from "./events";

export const EventTypeSchema = z.enum(EVENT_TYPES);

export const NewEventSchema = z.object({
  event_type: EventTypeSchema,
  user_id: z
    .string()
    .min(1, "user_id is required")
    .max(128, "user_id too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "user_id must be alphanumeric with _ or -"),
  metadata: z
    .record(z.unknown())
    .optional()
    .refine(
      (meta) => !meta || JSON.stringify(meta).length <= 10_000,
      "metadata payload too large (max 10KB)",
    ),
});

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const FetchEventsQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  limit: z.number().int().min(1).max(5000).default(2000),
});

export const ClearEventsSchema = z.object({
  owner_id: z.string().uuid(),
});

export type ValidatedNewEvent = z.infer<typeof NewEventSchema>;
export type ValidatedFetchQuery = z.infer<typeof FetchEventsQuerySchema>;

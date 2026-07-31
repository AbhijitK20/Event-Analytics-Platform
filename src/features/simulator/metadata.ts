import { EVENT_TYPES, type NewEvent } from "@/lib/events";

const CITIES = ["Lagos", "Nairobi", "Cairo", "Accra", "Kigali", "Casablanca"];
const VEHICLES = ["economy", "comfort", "xl", "moto"];
const PLACES = [
  "Ikeja GRA",
  "Victoria Island",
  "Westlands",
  "Kilimani",
  "Zamalek",
  "Osu",
  "Kimihurura",
  "Maarif",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUserId() {
  return `user_${String(Math.floor(Math.random() * 40) + 1).padStart(3, "0")}`;
}

export function buildMetadata(): Record<string, unknown> {
  const pickup = pick(PLACES);
  let destination = pick(PLACES);
  if (destination === pickup) destination = pick(PLACES);
  return {
    pickup,
    destination,
    fare: Number((Math.random() * 40 + 4).toFixed(2)),
    vehicle_type: pick(VEHICLES),
    city: pick(CITIES),
    driver_id: `driver_${String(Math.floor(Math.random() * 60) + 1).padStart(3, "0")}`,
    surge: Number((1 + Math.random()).toFixed(2)),
  };
}

export function buildSampleEvents(count = 100): NewEvent[] {
  return Array.from({ length: count }, () => ({
    event_type: pick(EVENT_TYPES),
    user_id: randomUserId(),
    metadata: buildMetadata(),
  }));
}

export type PresetEvent = {
  label: string;
  description: string;
  event_type: string;
  user_id: string;
  metadata: Record<string, unknown>;
};

export function buildPresets(): PresetEvent[] {
  const base = buildMetadata();
  return [
    {
      label: "Request a ride",
      description: "A passenger requests a new ride",
      event_type: "ride_requested",
      user_id: randomUserId(),
      metadata: { ...base, status: "pending" },
    },
    {
      label: "Driver assigned",
      description: "A driver picks up the request",
      event_type: "driver_assigned",
      user_id: randomUserId(),
      metadata: { ...base, status: "en_route" },
    },
    {
      label: "Ride completed",
      description: "Passenger dropped off successfully",
      event_type: "ride_completed",
      user_id: randomUserId(),
      metadata: { ...base, status: "completed", duration_min: Math.floor(Math.random() * 40 + 5) },
    },
    {
      label: "Payment failed",
      description: "Card declined or insufficient funds",
      event_type: "payment_failed",
      user_id: randomUserId(),
      metadata: { ...base, error: "card_declined", amount: base.fare },
    },
    {
      label: "Ride cancelled",
      description: "Passenger or driver cancels",
      event_type: "ride_cancelled",
      user_id: randomUserId(),
      metadata: {
        ...base,
        cancelled_by: pick(["rider", "driver"]),
        reason: pick(["long_wait", "changed_mind", "wrong_address"]),
      },
    },
    {
      label: "Payment success",
      description: "Fare charged to card",
      event_type: "payment_success",
      user_id: randomUserId(),
      metadata: { ...base, method: pick(["card", "wallet", "cash"]), charged: base.fare },
    },
  ];
}

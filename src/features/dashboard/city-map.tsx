import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CityData = {
  city: string;
  count: number;
};

const CITY_COORDS: Record<string, { x: number; y: number; label: string }> = {
  Lagos: { x: 22, y: 48, label: "Lagos" },
  Nairobi: { x: 68, y: 52, label: "Nairobi" },
  Cairo: { x: 55, y: 28, label: "Cairo" },
  Accra: { x: 18, y: 46, label: "Accra" },
  Kigali: { x: 64, y: 50, label: "Kigali" },
  Casablanca: { x: 12, y: 30, label: "Casablanca" },
};

function BubbleMap({
  cities,
  onCityClick,
  activeCity,
}: {
  cities: CityData[];
  onCityClick?: (city: string) => void;
  activeCity?: string | null;
}) {
  const maxCount = Math.max(...cities.map((c) => c.count), 1);

  const positioned = useMemo(
    () =>
      cities
        .filter((c) => CITY_COORDS[c.city])
        .map((c) => {
          const coords = CITY_COORDS[c.city]!;
          return {
            ...c,
            x: coords.x,
            y: coords.y,
            label: coords.label,
            radius: 8 + (c.count / maxCount) * 20,
            opacity: 0.3 + (c.count / maxCount) * 0.7,
          };
        }),
    [cities, maxCount],
  );

  return (
    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-muted/20 border border-border/30">
      {/* Simplified Africa outline */}
      <svg viewBox="0 0 100 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.08} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <rect width="100" height="70" fill="url(#map-glow)" />

        {/* Grid lines */}
        {[20, 40, 60, 80].map((x) => (
          <line
            key={`v${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={70}
            stroke="var(--border)"
            strokeOpacity={0.15}
            strokeDasharray="0.5 2"
          />
        ))}
        {[20, 35, 50].map((y) => (
          <line
            key={`h${y}`}
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke="var(--border)"
            strokeOpacity={0.15}
            strokeDasharray="0.5 2"
          />
        ))}

        {/* City bubbles */}
        <style>{`
          @keyframes map-pulse {
            0%, 100% { r: ${positioned[0]?.radius ? positioned[0].radius + 4 : 12}; opacity: 0.4; }
            50% { r: ${positioned[0]?.radius ? positioned[0].radius + 10 : 18}; opacity: 0.1; }
          }
          .city-bubble:hover .core-dot { transform: scale(1.3); }
          .city-bubble:hover .outer-glow { fill-opacity: 0.4; }
        `}</style>
        {positioned.map((city, i) => {
          const isActive = activeCity === city.city;
          return (
            <g
              key={city.city}
              className="city-bubble cursor-pointer"
              onClick={() => onCityClick?.(city.city)}
              style={{
                transition: "transform 0.3s ease",
                transformOrigin: `${city.x}px ${city.y}px`,
              }}
            >
              {/* Animated pulse ring for active city */}
              {isActive && (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={city.radius + 4}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={0.5}
                  opacity={0.4}
                  style={{
                    animation: `map-pulse 2s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              )}
              {/* Static pulse ring */}
              {!isActive && (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={city.radius + 4}
                  fill="none"
                  stroke="var(--chart-2)"
                  strokeOpacity={0.15}
                  strokeWidth={0.3}
                />
              )}
              {/* Outer glow */}
              <circle
                className="outer-glow"
                cx={city.x}
                cy={city.y}
                r={city.radius}
                fill={isActive ? "var(--primary)" : "var(--chart-2)"}
                fillOpacity={isActive ? city.opacity * 0.3 : city.opacity * 0.2}
                style={{ transition: "fill-opacity 0.3s ease" }}
              />
              {/* Core dot */}
              <circle
                className="core-dot"
                cx={city.x}
                cy={city.y}
                r={3}
                fill={isActive ? "var(--primary)" : "var(--chart-2)"}
                fillOpacity={0.9}
                stroke={isActive ? "var(--primary)" : "var(--chart-2)"}
                strokeWidth={isActive ? 0.5 : 0}
                strokeOpacity={0.5}
              />
              {/* Count label */}
              <text
                x={city.x}
                y={city.y - city.radius - 2}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize={isActive ? 3.5 : 2.5}
                fontWeight={isActive ? 700 : 500}
                opacity={0.8}
              >
                {city.count}
              </text>
              {/* City name */}
              <text
                x={city.x}
                y={city.y + city.radius + 4}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize={2.2}
                fontWeight={500}
              >
                {city.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function CityMap({
  cities,
  onCityClick,
  activeCity,
}: {
  cities: CityData[];
  onCityClick?: (city: string) => void;
  activeCity?: string | null;
}) {
  const totalEvents = cities.reduce((s, c) => s + c.count, 0);
  const topCity = cities.length > 0 ? [...cities].sort((a, b) => b.count - a.count)[0] : null;

  return (
    <Card className="panel-surface animate-fade-in-up stagger-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            Event Map
          </CardTitle>
          <div className="flex items-center gap-2">
            {topCity && (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
              >
                Top: {topCity.city}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {totalEvents} events
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <BubbleMap cities={cities} onCityClick={onCityClick} activeCity={activeCity} />
      </CardContent>
    </Card>
  );
}

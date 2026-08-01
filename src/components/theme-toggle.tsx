import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("kamel-theme");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("kamel-theme", next ? "dark" : "light");
    if (iconRef.current) {
      iconRef.current.style.animation = "spin-once 0.3s ease-in-out";
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="size-8 text-muted-foreground hover:text-foreground"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div ref={iconRef}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</div>
    </Button>
  );
}

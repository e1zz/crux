import { useEffect, useState, type ComponentType } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Props = {
  /** Module-specific top bar content */
  topBarContent?: ComponentType;
};

/**
 * Sticky top bar shell.
 *
 * The top bar is intentionally minimal: it carries only the global player
 * search and a chip showing the signed-in user (name + region). Everything
 * else — navigation, status, theme toggle, brand — lives in the left-hand
 * sidebar.
 *
 * The `topBarContent` is injected by the active game module.
 */
export function TopBar({ topBarContent: TopBarContent }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 4);

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 my-2 transition-[background-color,border-color,box-shadow] duration-300",
        isScrolled
          ? "border-border bg-background/80 shadow-sm backdrop-blur-md"
          : "border-transparent bg-background",
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
      <div className="flex w-full items-center gap-2">
        {TopBarContent ? <TopBarContent /> : null}
      </div>
    </div>
  );
}

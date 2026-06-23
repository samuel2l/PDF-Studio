import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollHintProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
  hint?: string;
}

export function ScrollHint({
  children,
  className = "",
  maxHeight = "min(60vh, 520px)",
  hint = "Scroll for more",
}: ScrollHintProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const down = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
    const up = el.scrollTop > 8;
    setCanScrollDown(down);
    setCanScrollUp(up);
    setShowHint(down);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    update();
    el.addEventListener("scroll", update, { passive: true });

    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update, children]);

  const handleScroll = () => {
    update();
    if (scrollRef.current && scrollRef.current.scrollTop > 24) {
      setShowHint(false);
    }
  };

  return (
    <div className={`scroll-hint-wrap relative overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      {canScrollUp && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-white via-white/80 to-transparent"
          aria-hidden
        />
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-auto overscroll-contain"
        style={{ maxHeight }}
      >
        {children}
      </div>

      {canScrollDown && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-white via-white/90 to-transparent"
            aria-hidden
          />
          {showHint && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center">
              <span className="scroll-hint-badge inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                <ChevronDown className="h-3.5 w-3.5 animate-bounce text-brand-600" />
                {hint}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

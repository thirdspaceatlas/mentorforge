"use client";

import clsx from "clsx";
import { type ReactNode, useEffect, useRef, useState } from "react";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
};

export function RevealOnScroll({ children, className }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

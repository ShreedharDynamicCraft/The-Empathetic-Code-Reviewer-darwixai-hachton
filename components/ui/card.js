import * as React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur ${className}`}
      {...props}
    />
  );
}



import * as React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 ${className}`}
      {...props}
    />
  );
}



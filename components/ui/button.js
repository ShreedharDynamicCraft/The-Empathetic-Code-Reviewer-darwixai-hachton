import * as React from "react";

export function Button({ className = "", variant = "default", ...props }) {
  const variants = {
    default:
      "inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium shadow hover:opacity-90 transition disabled:opacity-50",
    secondary:
      "inline-flex items-center justify-center rounded-md bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-sm px-3 py-2 hover:bg-white/80 dark:hover:bg-white/15 transition",
  };
  return <button className={`${variants[variant] || variants.default} ${className}`} {...props} />;
}



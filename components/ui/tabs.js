"use client";
import * as React from "react";

export function Tabs({ defaultValue, children }) {
  const [value, setValue] = React.useState(defaultValue);
  const api = React.useMemo(() => ({ value, setValue }), [value]);
  return <div data-tabs>{React.Children.map(children, (c) => React.cloneElement(c, { api }))}</div>;
}

export function TabsList({ children, api }) {
  return <div className="mb-3 inline-flex items-center gap-1 rounded-lg bg-black/5 dark:bg-white/10 p-1">{React.Children.map(children, (c) => React.cloneElement(c, { api }))}</div>;
}

export function TabsTrigger({ value, children, api }) {
  const active = api.value === value;
  return (
    <button
      onClick={() => api.setValue(value)}
      className={`px-3 py-1.5 text-sm rounded-md transition ${active ? "bg-white dark:bg-white/20" : "opacity-70 hover:opacity-100"}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, api }) {
  if (api.value !== value) return null;
  return <div className="mt-3">{children}</div>;
}



import type { InputHTMLAttributes } from "react";
import { cn } from "@/common/utils/cn.util";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function AuthInput({
  className,
  label,
  error,
  hint,
  id,
  ...props
}: AuthInputProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        id={id}
        className={cn(
          "w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </label>
  );
}

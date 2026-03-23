import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  error?: string;
  hint?: string;
  leftEl?: ReactNode;
  rightEl?: ReactNode;
}

export default function Input({ label, error, hint, leftEl, rightEl, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-ap-secondary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftEl && (
          <div className="absolute left-3.5 text-ap-tertiary pointer-events-none flex items-center">
            {leftEl}
          </div>
        )}
        <input
          {...props}
          className={[
            "w-full rounded-2xl border bg-ap-bg text-[15px] text-ap-primary placeholder:text-ap-tertiary",
            "py-3 transition-all outline-none",
            leftEl ? "pl-10" : "pl-4",
            rightEl ? "pr-10" : "pr-4",
            error
              ? "border-ap-red/50 focus:border-ap-red focus:ring-2 focus:ring-ap-red/10"
              : "border-ap-border focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
          ].join(" ")}
        />
        {rightEl && (
          <div className="absolute right-3.5 flex items-center">
            {rightEl}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[12px] text-ap-red">{error}</p>
      )}
      {!error && hint && (
        <p className="text-[12px] text-ap-tertiary">{hint}</p>
      )}
    </div>
  );
}

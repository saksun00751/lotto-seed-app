import { InputHTMLAttributes, ReactNode, useId } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  leftEl?: ReactNode;
  rightEl?: ReactNode;
}

export default function Input({ label, error, hint, leftEl, rightEl, ...props }: InputProps) {
  const autoId = useId();
  const inputId = props.id ?? `input-${autoId}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-text-default">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftEl && (
          <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
            {leftEl}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={[
            "w-full rounded-2xl border bg-surface-subtle text-[15px] text-text-strong placeholder:text-text-muted",
            "py-3 transition-all outline-none",
            leftEl ? "pl-10" : "pl-4",
            rightEl ? "pr-10" : "pr-4",
            error
              ? "border-status-error/50 focus:border-status-error focus:ring-2 focus:ring-status-error/10"
              : "border-border-default focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
          ].join(" ")}
        />
        {rightEl && (
          <div className="absolute right-3.5 flex items-center">
            {rightEl}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-[12px] text-status-error">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-[12px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}

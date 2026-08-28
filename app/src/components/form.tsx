"use client";

import { useActionState } from "react";

type ActionState = { error?: string } | undefined;

export function ActionForm({
  action,
  children,
  submitLabel,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state?.error && (
        <p role="alert" className="rounded bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-signal px-4 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
      >
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = true,
  placeholder,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
        {!required && <span className="ml-1 font-normal text-ink-soft">(optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded border-2 border-ink/30 bg-white px-3 py-2 focus:border-signal focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  required = true,
  placeholder,
  rows = 4,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  hint?: string;
  defaultValue?: string;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
        {!required && <span className="ml-1 font-normal text-ink-soft">(optional)</span>}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded border-2 border-ink/30 bg-white px-3 py-2 focus:border-signal focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  required = true,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  defaultValue?: string;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded border-2 border-ink/30 bg-white px-3 py-2 focus:border-signal focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

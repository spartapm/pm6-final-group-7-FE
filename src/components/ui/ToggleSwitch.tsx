"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
}

export function ToggleSwitch({ checked, onChange, "aria-label": ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

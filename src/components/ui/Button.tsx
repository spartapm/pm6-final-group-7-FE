"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "white";
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  loading,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-gray-100 text-text-primary",
    outline: "border-2 border-primary text-primary bg-white",
    ghost: "bg-transparent text-text-secondary",
    white: "bg-white text-primary shadow-md",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "처리 중..." : children}
    </button>
  );
}

"use client";

import Link from "next/link";

interface MyMenuItemProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  titleClassName?: string;
  showDivider?: boolean;
}

export function MyMenuItem({
  href,
  onClick,
  icon,
  iconBg,
  title,
  subtitle,
  titleClassName = "text-[#1c1c27]",
  showDivider = false,
}: MyMenuItemProps) {
  const content = (
    <>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[17px] font-bold ${titleClassName}`}>{title}</p>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#9096a6]">{subtitle}</p>}
      </div>
      <span className="shrink-0 text-[#c4c7d0]">›</span>
    </>
  );

  const className = `flex w-full items-center gap-4 px-5 py-4 text-left ${
    showDivider ? "border-t border-gray-100" : ""
  }`;

  if (href) {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

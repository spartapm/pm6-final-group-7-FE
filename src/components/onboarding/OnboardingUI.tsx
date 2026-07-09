"use client";

import Link from "next/link";

export function OnboardingNextButton({
  disabled,
  loading,
  onClick,
  backHref,
  label = "다음",
}: {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  backHref?: string;
  label?: string;
}) {
  return (
    <div className="fixed bottom-0 left-1/2 flex w-full max-w-[390px] -translate-x-1/2 gap-3 border-t bg-white p-4">
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center justify-center rounded-2xl border-2 border-gray-200 px-5 py-4 text-base font-semibold"
        >
          이전
        </Link>
      )}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white disabled:cursor-not-allowed ${
          disabled || loading ? "bg-[#cbcdd6]" : "bg-primary"
        }`}
      >
        {loading ? "저장 중..." : label}
        {!loading && <span>›</span>}
      </button>
    </div>
  );
}

export function OnboardingSectionLabel({
  title,
  required,
}: {
  title: string;
  required?: boolean | "optional";
}) {
  return (
    <div className="mt-6 flex items-baseline gap-2 first:mt-0">
      <p className="text-lg font-bold text-[#1f2937]">{title}</p>
      {required === true && (
        <span className="text-[13px] text-[#f8736f]">필수</span>
      )}
      {required === "optional" && (
        <span className="text-[13px] text-[#aca8b2]">(선택)</span>
      )}
    </div>
  );
}

export function OnboardingChip({
  label,
  selected,
  onClick,
  className = "",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-[15px] font-bold transition ${className} ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-gray-200 bg-white text-[#212c3d]"
      }`}
    >
      {label}
    </button>
  );
}

export function OnboardingCategoryTag({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full bg-[#eef0fb] px-2.5 py-1 text-[13px] font-bold text-[#565dbc]">
      {label}
    </span>
  );
}

export function OnboardingCheckboxCard({
  label,
  checked,
  onToggle,
  badge,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left ${
        checked ? "border-primary bg-[#eef0fb]" : "border-gray-200 bg-white"
      }`}
    >
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 ${
          checked ? "border-primary bg-primary text-xs text-white" : "border-gray-300 bg-white"
        }`}
      >
        {checked && "✓"}
      </span>
      <span className={`flex-1 text-[17px] font-bold ${checked ? "text-[#5c68b8]" : "text-[#101828]"}`}>
        {label}
      </span>
      {badge && <OnboardingCategoryTag label={badge} />}
    </button>
  );
}

export function OnboardingRadioCard({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        selected ? "border-primary bg-[#eef0fb]" : "border-gray-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 ${
            selected ? "border-primary bg-primary text-xs text-white" : "border-gray-300 bg-white"
          }`}
        >
          {selected && "✓"}
        </span>
        <span className={`text-[17px] font-bold ${selected ? "text-[#5c68b8]" : "text-[#101828]"}`}>
          {label}
        </span>
      </button>
      {selected && children && (
        <div className="border-t border-primary/20 px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  );
}

export function OnboardingFollowUpChips({
  question,
  options,
  value,
  onChange,
  columns = 2,
}: {
  question: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 4 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div>
      <p className="mb-3 text-base font-bold text-[#1f2937]">{question}</p>
      <div className={`grid gap-2 ${gridClass}`}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-xl border px-2 py-2.5 text-sm font-bold ${
              value === o
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-[#212c3d]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OnboardingTimeDayFollowUp({
  value,
  onChange,
}: {
  value: { timeSlot: string | null; dayType: string | null };
  onChange: (v: { timeSlot: string | null; dayType: string | null }) => void;
}) {
  const timeOptions = ["오전", "오후", "저녁", "상관없음"];
  const dayOptions = ["평일", "주말", "상관없음"];

  return (
    <div>
      <p className="mb-3 text-base font-bold text-[#1f2937]">
        원하는 요일 및 시간대는 언제인가요?
      </p>
      <p className="mb-2 text-sm text-[#9a9da8]">시간대</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {timeOptions.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange({ ...value, timeSlot: o })}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
              value.timeSlot === o
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-[#212c3d]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-[#9a9da8]">요일</p>
      <div className="flex flex-wrap gap-2">
        {dayOptions.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange({ ...value, dayType: o })}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
              value.dayType === o
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-[#212c3d]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

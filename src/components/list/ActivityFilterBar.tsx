"use client";

import { useState } from "react";
import Image from "next/image";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ASSETS } from "@/lib/assets";
import type { FilterDefinition, JobsFilterValues } from "@/lib/jobs-filters";

interface ActivityFilterBarProps {
  filters: FilterDefinition[];
  values: JobsFilterValues;
  onChange: (id: string, values: string[]) => void;
  /** 필터 칩 행 맨 앞 초기화 */
  onReset?: () => void;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterChipButton({
  label,
  active,
  open,
  onClick,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${
        active || open
          ? "border-primary bg-primary text-white"
          : "border-[#e5e7eb] bg-white text-[#3a3a42]"
      }`}
    >
      {label}
      <Chevron open={open} />
    </button>
  );
}

function ListFilterPanel({
  options,
  selected,
  onToggle,
}: {
  options: FilterDefinition["options"];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const noneSelected = selected.length === 0;
  return (
    <div>
      {options.map((option, idx) => {
        const isAll = option.value === "";
        const checked = isAll ? noneSelected : selected.includes(option.value);
        return (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onToggle(option.value)}
            className={`flex w-full items-center justify-between px-6 py-4 text-left text-[17px] ${
              checked ? "bg-[#eef0fb] font-bold text-primary" : "font-normal text-[#1c1c27]"
            } ${idx < options.length - 1 ? "border-b border-[#eceef2]" : ""}`}
          >
            <span>{option.label}</span>
            {checked && (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path
                  d="M3.5 9.2L7.1 12.8L14.5 5.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChipsFilterPanel({
  options,
  value,
  onSelect,
}: {
  options: FilterDefinition["options"];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`rounded-full border px-4 py-2.5 text-[16px] font-bold transition ${
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-[#e5e7eb] bg-white text-[#333640]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityFilterBar({ filters, values, onChange, onReset }: ActivityFilterBarProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openFilter = filters.find((f) => f.id === openId);

  function handleChipSelect(id: string, value: string) {
    onChange(id, value ? [value] : []);
    setOpenId(null);
  }

  function handleListToggle(id: string, value: string) {
    if (value === "") {
      onChange(id, []);
      return;
    }
    const current = values[id] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange(id, next);
  }

  return (
    <div className="bg-white">
      {/* IV-17: 필터 칩 행 스크롤바 노출 (본문 스크롤바와 별개) */}
      <div className="flex gap-2 overflow-x-auto border-b border-[#eceef2] px-4 py-3 [scrollbar-width:thin]">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e5e7eb] bg-white px-3.5 py-2 text-[13px] font-bold text-[#5a5a64]"
            aria-label="필터 초기화"
          >
            <Image src={ASSETS.iconFilterReset} alt="" width={14} height={14} unoptimized />
            초기화
          </button>
        )}
        {filters.map((filter) => {
          const selectedValues = values[filter.id] ?? [];
          const selected = selectedValues.length > 0;
          const open = openId === filter.id;
          let label = filter.label;
          if (selected) {
            const firstLabel =
              filter.options.find((o) => o.value === selectedValues[0])?.label ??
              selectedValues[0];
            label =
              selectedValues.length > 1
                ? `${firstLabel} +${selectedValues.length - 1}`
                : firstLabel;
          }
          return (
            <FilterChipButton
              key={filter.id}
              label={label}
              active={selected}
              open={open}
              onClick={() => setOpenId(open ? null : filter.id)}
            />
          );
        })}
      </div>

      {openFilter && (
        <BottomSheet
          open={Boolean(openFilter)}
          title={openFilter.label}
          onClose={() => setOpenId(null)}
        >
          {openFilter.layout === "list" ? (
            <ListFilterPanel
              options={openFilter.options}
              selected={values[openFilter.id] ?? []}
              onToggle={(value) => handleListToggle(openFilter.id, value)}
            />
          ) : (
            <ChipsFilterPanel
              options={openFilter.options}
              value={values[openFilter.id]?.[0] ?? ""}
              onSelect={(value) => handleChipSelect(openFilter.id, value)}
            />
          )}
        </BottomSheet>
      )}
    </div>
  );
}

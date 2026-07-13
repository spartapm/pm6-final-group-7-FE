"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { FilterDefinition, JobsFilterValues } from "@/lib/jobs-filters";

interface ActivityFilterBarProps {
  filters: FilterDefinition[];
  values: JobsFilterValues;
  onChange: (id: string, values: string[]) => void;
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[15px] font-bold transition ${
        active || open
          ? "border-primary bg-primary text-white"
          : "border-[#e5e7eb] bg-white text-[#333640]"
      }`}
    >
      {label}
      <Chevron open={open} />
    </button>
  );
}

/** 목록형: 다중 선택(체크박스). "전체"는 선택 해제. 선택해도 시트를 닫지 않음. */
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

/** 단일형(칩): 라디오 단일 선택. */
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

export function ActivityFilterBar({ filters, values, onChange }: ActivityFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const openFilter = filters.find((f) => f.id === openId);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [filters]);

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  // 칩(단일): 선택 후 닫기. "전체"(빈 값)면 해제
  function handleChipSelect(id: string, value: string) {
    onChange(id, value ? [value] : []);
    setOpenId(null);
  }

  // 목록(다중): "전체"면 전체 해제, 아니면 토글. 시트 유지
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
      <div className="flex items-center gap-1 border-b border-[#eceef2] px-2 py-3">
        <button
          type="button"
          aria-label="필터 이전"
          onClick={() => scrollBy(-140)}
          disabled={!canScrollLeft}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eceef2] text-[#b7b6c2] disabled:opacity-30"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filters.map((filter) => {
            const selectedValues = values[filter.id] ?? [];
            const selected = selectedValues.length > 0;
            const open = openId === filter.id;
            // FL-04: 선택 시 칩에 옵션명 표시(다중 선택은 "첫 옵션 +N")
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

        <button
          type="button"
          aria-label="필터 다음"
          onClick={() => scrollBy(140)}
          disabled={!canScrollRight}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eceef2] text-[#b7b6c2] disabled:opacity-30"
        >
          ›
        </button>
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

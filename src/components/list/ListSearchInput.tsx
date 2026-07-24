"use client";

import Image from "next/image";
import { ASSETS } from "@/lib/assets";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ListSearchInput({
  value,
  onChange,
  placeholder = "제목·기관명·지역으로 검색",
}: Props) {
  return (
    <div className="bg-white px-5 pb-2 pt-3">
      <div className="relative">
        <Image
          src={ASSETS.iconSearch}
          alt=""
          width={16}
          height={16}
          unoptimized
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8f9fc] py-3 pl-10 pr-10 text-[14px] text-[#141414] outline-none placeholder:text-[#9a9aa5] focus:border-primary [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          maxLength={30}
        />
        {value && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

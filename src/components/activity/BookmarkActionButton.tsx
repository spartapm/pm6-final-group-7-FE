"use client";

interface Props {
  bookmarked: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** 활성 테두리 색 (카테고리 테마) */
  accentBorder?: string;
}

/**
 * D720-like-tip: 하단 액션 바 찜 버튼 — "찜하기" 라벨 + 항상 노출되는 안내 툴팁
 * "찜하면 캘린더에 자동 등록돼요"
 */
export function BookmarkActionButton({ bookmarked, disabled, onClick, accentBorder }: Props) {
  return (
    <div className="relative shrink-0">
      <div className="absolute bottom-full left-0 z-40 mb-2 w-max max-w-[240px]">
        <div className="flex items-center gap-2 rounded-xl bg-[#3a3f52] px-3 py-2 text-[13px] font-semibold text-white shadow-lg">
          찜하면 캘린더에 자동 등록돼요
        </div>
        <div
          className="ml-5 h-2 w-3 bg-[#3a3f52]"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`flex h-[52px] w-[60px] flex-col items-center justify-center rounded-2xl border-[1.5px] ${
          bookmarked ? "text-red-500" : "text-[#9aa0a8]"
        }`}
        style={{ borderColor: bookmarked ? (accentBorder ?? "#5b6dbf") : "#e5e7eb" }}
        aria-label="찜하기"
      >
        <span className="text-xl leading-none">{bookmarked ? "♥" : "♡"}</span>
        <span className="mt-0.5 text-[11px] font-bold leading-none">찜하기</span>
      </button>
    </div>
  );
}

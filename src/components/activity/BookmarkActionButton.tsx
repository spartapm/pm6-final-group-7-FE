"use client";

import { useEffect, useState } from "react";

interface Props {
  bookmarked: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** 활성 테두리 색 (카테고리 테마) */
  accentBorder?: string;
}

/** SCR-016 #9: 찜 안내 말풍선 — 최초 1회만 (localStorage) */
const LIKE_TIP_SEEN_KEY = "oyukirang-like-tip-seen";

function hasSeenLikeTip(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(LIKE_TIP_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markLikeTipSeen() {
  try {
    localStorage.setItem(LIKE_TIP_SEEN_KEY, "1");
  } catch {
    // storage 접근 실패 무시
  }
}

/**
 * 하단 액션 바 찜 버튼 — 안내 말풍선 최초 1회
 * "찜하면 캘린더에 자동 등록돼요"
 * React Strict Mode 이중 마운트에서도 보이도록, 노출 후 짧게 유지한 뒤 seen 처리
 */
export function BookmarkActionButton({ bookmarked, disabled, onClick, accentBorder }: Props) {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (hasSeenLikeTip()) {
      setShowTip(false);
      return;
    }
    setShowTip(true);
    const t = window.setTimeout(() => {
      markLikeTipSeen();
    }, 800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="relative shrink-0 overflow-visible">
      {showTip && (
        <div className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 w-max max-w-[min(260px,70vw)]">
          <div className="rounded-xl bg-[#3a3f52] px-3 py-2 text-[13px] font-semibold leading-snug text-white shadow-lg">
            찜하면 캘린더에 자동 등록돼요
          </div>
          <div
            className="ml-5 h-2 w-3 bg-[#3a3f52]"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
        </div>
      )}
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

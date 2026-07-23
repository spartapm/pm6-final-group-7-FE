"use client";

import { useEffect, useState } from "react";

interface Props {
  bookmarked: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** 활성 테두리 색 (카테고리 테마) */
  accentBorder?: string;
}

/** 세션 동안만 유지 — 탭/브라우저를 끄면 다시 노출 */
const LIKE_TIP_DISMISSED_KEY = "oyukirang-like-tip-dismissed";

function isLikeTipDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(LIKE_TIP_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissLikeTip() {
  try {
    sessionStorage.setItem(LIKE_TIP_DISMISSED_KEY, "1");
  } catch {
    // storage 접근 실패 무시
  }
}

/**
 * 하단 액션 바 찜 버튼 — 안내 말풍선 + X로 세션 동안 닫기
 * "찜하면 캘린더에 자동 등록돼요"
 */
export function BookmarkActionButton({ bookmarked, disabled, onClick, accentBorder }: Props) {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    setShowTip(!isLikeTipDismissed());
  }, []);

  function handleDismissTip(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismissLikeTip();
    setShowTip(false);
  }

  return (
    <div className="relative shrink-0">
      {showTip && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-max max-w-[260px]">
          <div className="flex items-start gap-2 rounded-xl bg-[#3a3f52] px-3 py-2 text-[13px] font-semibold text-white shadow-lg">
            <span className="min-w-0 flex-1 leading-snug">찜하면 캘린더에 자동 등록돼요</span>
            <button
              type="button"
              onClick={handleDismissTip}
              className="-mr-0.5 -mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="안내 닫기"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
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

"use client";

import { useEffect, useState } from "react";

interface LikeCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDismissForever: () => void;
}

/** S-07 찜 안내 팝업: 캘린더 아이콘 + 안내문 + "더 이상 보지 않기" 체크박스 + 확인 버튼 */
export function LikeCompleteDialog({ open, onClose, onDismissForever }: LikeCompleteDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) setDontShowAgain(false);
  }, [open]);

  if (!open) return null;

  function handleConfirm() {
    if (dontShowAgain) onDismissForever();
    else onClose();
  }

  return (
    <div className="mobile-overlay" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef0fb] text-2xl">
            📅
          </div>
        </div>
        <h3 className="mt-4 text-center text-lg font-bold text-text-primary">찜 목록에 추가됐어요!</h3>
        <p className="mt-2 text-center text-sm text-text-secondary">
          찜한 내역은 내 캘린더에서 확인할 수 있습니다.
        </p>

        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          더 이상 보지 않기
        </label>

        <button
          className="mt-5 w-full rounded-xl bg-primary py-3 font-semibold text-white"
          onClick={handleConfirm}
        >
          확인
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="mobile-bottom-sheet-overlay" onClick={onClose}>
      <div className="mobile-bottom-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-[#e5e7eb]" aria-hidden />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 className="min-w-0 flex-1 text-[17px] font-bold leading-snug text-[#1c1c27]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 p-1 text-2xl leading-none text-text-muted"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="mobile-bottom-sheet-body">{children}</div>
      </div>
    </div>
  );
}

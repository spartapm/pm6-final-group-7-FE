"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  emoji?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  emoji,
  confirmLabel = "예",
  cancelLabel = "아니요",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="mobile-overlay" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {emoji && <p className="text-center text-4xl">{emoji}</p>}
        <h3 className={`text-lg font-bold text-text-primary ${emoji ? "mt-3 text-center" : ""}`}>
          {title}
        </h3>
        {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface LikeCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDismissForever: () => void;
}

export function LikeCompleteDialog({ open, onClose, onDismissForever }: LikeCompleteDialogProps) {
  return (
  <ConfirmModal
    open={open}
    title="찜 완료!"
    description="캘린더에서 일정을 확인할 수 있어요."
    confirmLabel="확인"
    cancelLabel="더 이상 보지 않기"
    onConfirm={onClose}
    onCancel={onDismissForever}
  />
  );
}

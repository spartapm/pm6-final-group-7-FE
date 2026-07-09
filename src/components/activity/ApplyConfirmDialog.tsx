"use client";

import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface ApplyConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApplyConfirmDialog({ open, onConfirm, onCancel }: ApplyConfirmDialogProps) {
  return (
    <ConfirmModal
      open={open}
      title="신청을 완료하셨나요?"
      description="외부 사이트에서 신청을 마치셨다면 신청완료로 표시해주세요."
      confirmLabel="신청 완료"
      cancelLabel="아직 안 했어요"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

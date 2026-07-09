"use client";

import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface LoginPromptDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginPromptDialog({ open, onClose, onLogin }: LoginPromptDialogProps) {
  return (
    <ConfirmModal
      open={open}
      emoji="🔐"
      title="로그인이 필요해요"
      description="찜하기·신청하기는 로그인 후 이용할 수 있어요."
      confirmLabel="로그인하기"
      cancelLabel="닫기"
      onConfirm={onLogin}
      onCancel={onClose}
    />
  );
}

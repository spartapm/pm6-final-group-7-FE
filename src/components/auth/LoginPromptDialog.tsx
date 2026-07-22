"use client";

import { ConfirmModal } from "@/components/ui/ConfirmModal";

export type LoginPromptReason =
  | "refresh"
  | "bookmark"
  | "personalize"
  | "profile"
  | "calendarSave"
  | "applySave"
  | "notification"
  | "generic";

const DESCRIPTIONS: Record<LoginPromptReason, string> = {
  refresh: "맞춤 추천 새로고침은 로그인 후 이용할 수 있어요.",
  bookmark: "찜하기는 로그인 후 이용할 수 있어요.",
  personalize: "개인화 설정 변경은 로그인 후 이용할 수 있어요.",
  profile: "프로필 수정은 로그인 후 이용할 수 있어요.",
  calendarSave: "캘린더 저장은 로그인 후 이용할 수 있어요.",
  applySave: "신청완료 상태 저장은 로그인 후 이용할 수 있어요.",
  notification: "알림은 로그인 후 이용할 수 있어요.",
  generic: "로그인하면 맞춤 추천과 찜하기 기능을 이용할 수 있어요.",
};

interface LoginPromptDialogProps {
  open: boolean;
  reason?: LoginPromptReason;
  onClose: () => void;
  onLogin: () => void;
}

/** Figma 상황별 loginPrompt (1:3976, 19:131, 27:131, 27:248) */
export function LoginPromptDialog({
  open,
  reason = "generic",
  onClose,
  onLogin,
}: LoginPromptDialogProps) {
  return (
    <ConfirmModal
      open={open}
      title="로그인이 필요해요"
      description={DESCRIPTIONS[reason]}
      confirmLabel="로그인하기"
      cancelLabel="취소"
      onConfirm={onLogin}
      onCancel={onClose}
    />
  );
}

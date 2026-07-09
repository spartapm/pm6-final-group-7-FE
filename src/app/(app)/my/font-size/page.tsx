"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/types";

const FONT_OPTIONS = [
  { id: "small", label: "작게", size: "14px" },
  { id: "default", label: "보통", size: "16px" },
  { id: "large", label: "크게", size: "18px" },
  { id: "xlarge", label: "매우 크게", size: "20px" },
] as const;

type FontSizeId = (typeof FONT_OPTIONS)[number]["id"];

/** SCR-021 글자 크기 설정 */
export default function FontSizePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const [selected, setSelected] = useState<FontSizeId>("default");
  const [loading, setLoading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    const size = (me?.preferences?.font_size as FontSizeId) ?? "default";
    setSelected(size);
    document.documentElement.dataset.fontSize = size;
  }, [me?.preferences?.font_size]);

  function handleSelect(id: FontSizeId) {
    setSelected(id);
    document.documentElement.dataset.fontSize = id;
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiFetch("/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ font_size: selected }),
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      showToast("글자 크기를 저장했어요.");
      router.push("/my");
    } finally {
      setLoading(false);
    }
  }

  const previewSize =
    FONT_OPTIONS.find((o) => o.id === selected)?.size ?? "16px";

  return (
    <div className="min-h-full bg-[#f8f9fc] pb-8">
      <AppHeader title="글자 크기 설정" backHref="/my" />

      <div className="px-5 py-5">
        <p className="text-[14px] font-bold text-[#9096a6]">미리보기</p>
        <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-4">
          <div className="rounded-xl bg-[#f3f0ff] px-4 py-4">
            <p className="font-bold text-[#4b4fd1]" style={{ fontSize: previewSize }}>
              아파트 경비원 모집
            </p>
            <p className="mt-1 text-[#8b8fa0]" style={{ fontSize: previewSize }}>
              강남아파트관리(주) · 서울 강남구
            </p>
            <p className="mt-2 font-bold text-[#7b7fe0]" style={{ fontSize: previewSize }}>
              🎯 댁에서 가까운 강남구 공고예요
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {FONT_OPTIONS.map((option, index) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left ${
                  index > 0 ? "border-t border-gray-100" : ""
                } ${isSelected ? "bg-[#f3f0ff]" : ""}`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[17px] font-bold ${
                    isSelected
                      ? "bg-primary text-white"
                      : "border border-[#e5e7eb] bg-white text-[#333640]"
                  }`}
                >
                  가
                </div>
                <div className="flex-1">
                  <p className="text-[18px] font-bold text-[#1c1c27]">{option.label}</p>
                  <p className="text-[14px] text-[#9096a6]">{option.size}</p>
                </div>
                {isSelected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button fullWidth disabled={loading} className="mt-6" onClick={handleSave}>
          {loading ? "저장 중..." : "저장하기"}
        </Button>

        <Link href="/my" className="mt-4 block text-center text-sm text-text-muted">
          마이페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}

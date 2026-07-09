"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/types";
import { SEOUL_DISTRICTS } from "@/lib/onboarding";

export default function MySettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [district, setDistrict] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState("default");
  const [loading, setLoading] = useState(false);
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    if (me) {
      setDistrict(me.onboarding?.region_district ?? null);
      setFontSize(me.preferences?.font_size ?? "default");
    }
  }, [me]);

  async function handleSave() {
    setLoading(true);
    try {
      if (district) {
        await apiFetch("/me/onboarding", {
          method: "PATCH",
          body: JSON.stringify({ region_district: district }),
        });
      }
      await apiFetch("/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ font_size: fontSize }),
      });
      await apiFetch("/recommendations/refresh", { method: "POST", body: JSON.stringify({}) });
      await queryClient.invalidateQueries();
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-8">
      <AppHeader title="개인화 설정" backHref="/my" />
      <div className="px-5 py-6">
        <p className="font-semibold">지역</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEOUL_DISTRICTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDistrict(d)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                district === d ? "bg-primary text-white" : "border-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <p className="mt-8 font-semibold">글자 크기</p>
        <div className="mt-3 flex gap-2">
          {[
            { id: "default", label: "기본" },
            { id: "large", label: "크게" },
            { id: "xlarge", label: "아주 크게" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFontSize(f.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                fontSize === f.id ? "bg-primary text-white" : "border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button fullWidth loading={loading} className="mt-8" onClick={handleSave}>
          저장
        </Button>

      </div>
    </div>
  );
}

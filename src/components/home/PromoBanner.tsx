export function PromoBanner() {
  return (
    <div className="mx-5 mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7c6fd6] to-[#9b8ce8] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/35 bg-white/15 text-xs font-bold text-white/75"
          aria-hidden
        >
          AD
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#f0e9fa]">AD · 한국노인인력개발원</p>
          <p className="text-base font-bold text-white">시니어 창업 지원 프로그램</p>
          <p className="text-sm font-bold text-white/95">선착순 50명 모집 중</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-banner-cta"
        >
          알아보기
        </button>
      </div>
    </div>
  );
}

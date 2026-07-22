"use client";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function ListPagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[15px] font-semibold text-[#333640] disabled:opacity-40"
      >
        이전
      </button>
      <span className="px-2 text-[15px] font-bold text-[#1c1c27]">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[15px] font-semibold text-[#333640] disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}

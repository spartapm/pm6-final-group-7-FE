interface Props {
  label?: string;
  className?: string;
  aspect?: "square" | "banner" | "wide";
}

const aspectClass = {
  square: "aspect-square",
  banner: "aspect-[350/210]",
  wide: "aspect-[350/85]",
};

/** Figma에서 export 불가한 이미지 영역 placeholder */
export function ImagePlaceholder({
  label = "이미지",
  className = "",
  aspect = "square",
}: Props) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-[#d1d5db] bg-[#f3f4f6] ${aspectClass[aspect]} ${className}`}
      aria-hidden
    >
      <span className="text-center text-sm font-medium text-[#9ca3af]">{label}</span>
    </div>
  );
}

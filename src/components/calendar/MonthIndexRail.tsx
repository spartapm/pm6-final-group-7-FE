"use client";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Figma DateRail 활성 원 직경 */
const VISUAL_SIZE = 31;
/** 터치 영역 높이 (시각 원보다 크게) */
const TOUCH_HEIGHT = 44;
const TOUCH_WIDTH = 40;

interface Props {
  /** 현재 보고 있는 월 (1~12) */
  activeMonth: number;
  /** 데이터가 있어 이동 가능한 월. 미전달 시 전부 활성 */
  enabledMonths?: ReadonlySet<number> | number[];
  onSelect: (month: number) => void;
}

/** 일정 리스트 우측 월 인덱스 레일 (1~12) — Figma DateRail */
export function MonthIndexRail({ activeMonth, enabledMonths, onSelect }: Props) {
  const enabled =
    enabledMonths == null
      ? null
      : enabledMonths instanceof Set
        ? enabledMonths
        : new Set(enabledMonths);

  return (
    <aside
      className="sticky top-0 z-10 flex shrink-0 flex-col items-center self-start"
      aria-label="월 바로가기"
    >
      <div className="flex flex-col items-center bg-white">
        {MONTHS.map((m) => {
          const isEnabled = enabled == null || enabled.has(m);
          const isActive = activeMonth === m && isEnabled;
          return (
            <button
              key={m}
              type="button"
              disabled={!isEnabled}
              onClick={() => onSelect(m)}
              aria-label={`${m}월로 이동`}
              aria-current={isActive ? "true" : undefined}
              className="flex items-center justify-center"
              style={{ width: TOUCH_WIDTH, height: TOUCH_HEIGHT }}
            >
              <span
                className={`flex items-center justify-center rounded-full font-bold leading-none ${
                  isActive
                    ? "bg-[#7184EA] text-[18px] text-white"
                    : isEnabled
                      ? "text-[17px] text-[#9aa8ba]"
                      : "text-[17px] text-[#c5ccd6]"
                }`}
                style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}
              >
                {m}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

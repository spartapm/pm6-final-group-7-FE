import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";

const PAIN_POINTS = [
  {
    emoji: "😓",
    problem: "정보가 흩어져 있어 찾기 어려워요",
    title: "통합 탐색",
    description: "일자리·교육·취미·지원사업을 한 앱에서 검색",
    icon: ASSETS.landingIconSearch,
    iconBg: "bg-[#e8ecfb]",
  },
  {
    emoji: "🤔",
    problem: "나에게 맞는지 판단하기 어려워요",
    title: "사용자 맞춤 추천 + AI 공고 요약",
    description: "나이·경력·지역 기반 추천, 핵심 정보는 AI가 한눈에 요약",
    icon: ASSETS.landingIconAi,
    iconBg: "bg-[#e8ecfb]",
  },
  {
    emoji: "⏰",
    problem: "신청 마감일을 자주 놓쳐요",
    title: "캘린더 자동 등록 + 마감 임박 알림",
    description: "찜한 활동의 마감일을 미리 챙겨드려요",
    icon: ASSETS.landingIconCalendar,
    iconBg: "bg-[#fde8ea]",
  },
] as const;

const STEPS = [
  {
    num: "01",
    title: "간단한 정보 입력",
    description: "지역·나이·관심 분야를 3분 안에 입력하면 준비 완료.",
  },
  {
    num: "02",
    title: "맞춤 추천 생성",
    description: "온보딩 기반 나에게 딱 맞는 활동을 추천해 드려요",
  },
  {
    num: "03",
    title: "원하는 활동 신청",
    description: "마음에 드는 활동을 찜하고 바로 신청하세요.",
  },
] as const;

const HERO_GRADIENT =
  "linear-gradient(156deg, #5b6dbf 0%, #7c8ce4 55%, #9ba9ec 100%)";
const CTA_GRADIENT =
  "linear-gradient(160deg, #5b6dbf 0%, #7c8ce4 50%, #9ba9ec 100%)";

/** SCR-000 랜딩 — PDF「랜딩 및 로그인」+ Figma 1:1799 */
export default function LandingPage() {
  return (
    <div className="bg-white text-text-primary">
      {/* Hero */}
      <section
        className="flex flex-col px-6 pb-10 pt-[52px] text-white"
        style={{ backgroundImage: HERO_GRADIENT }}
      >
        <div className="flex justify-center">
          <div className="flex size-[88px] items-center justify-center overflow-hidden rounded-[26px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
            <Image
              src={ASSETS.logoLanding}
              alt="오육이랑"
              width={88}
              height={88}
              className="size-full object-cover"
              priority
            />
          </div>
        </div>

        <h1 className="mt-3 text-center text-[32px] font-black leading-[1.3] tracking-tight">
          5060의 새로운 시작,
          <br />
          오육이랑과 함께
        </h1>

        <p className="mt-4 text-center text-[19px] leading-[1.6] text-[#e4e7fb]">
          흩어진 일자리·교육·취미 정보를 한 곳에서.
          <br />
          내 상황에 딱 맞는 활동을 쉽게 찾고 신청하세요.
        </p>

        <Link
          href="/onboarding/region"
          className="mt-8 flex h-[68px] items-center justify-center gap-2 rounded-2xl bg-white text-[20px] font-black text-[#5b6dbf] shadow-[0_12px_15px_rgba(0,0,0,0.2)]"
        >
          지금 바로 시작하기
          <Image
            src={ASSETS.arrowRight}
            alt=""
            width={20}
            height={20}
            className="size-5"
            unoptimized
          />
        </Link>

        <Link
          href="/login"
          className="mt-3 flex h-[60px] items-center justify-center rounded-2xl border border-white/70 bg-white/10 text-[18px] font-bold text-white backdrop-blur-[2px]"
        >
          로그인하기
        </Link>

        <p className="mt-8 text-center text-base font-bold text-white/85">
          무료 · 3분이면 시작
        </p>
      </section>

      {/* Pain points */}
      <section className="bg-[#f7f8fc] px-6 py-11">
        <h2 className="text-center text-[22px] font-extrabold leading-snug">
          이런 고민, 오육이랑이 해결합니다
        </h2>

        <div className="mt-7 flex flex-col gap-4">
          {PAIN_POINTS.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-[#e8ebf5] bg-white shadow-[0_4px_16px_rgba(91,109,191,0.08)]"
            >
              <div className="flex items-center gap-3 bg-[#f0f2f8] px-[18px] py-4">
                <span className="text-[22px] leading-none" aria-hidden>
                  {item.emoji}
                </span>
                <p className="text-[15px] font-bold text-[#3d4558]">{item.problem}</p>
              </div>

              <div className="flex justify-center py-1.5">
                <Image
                  src={ASSETS.landingChevronDown}
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                />
              </div>

              <div className="flex items-start gap-3.5 px-[18px] pb-5 pt-1">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-[14px] ${item.iconBg}`}
                >
                  <Image
                    src={item.icon}
                    alt=""
                    width={22}
                    height={22}
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-extrabold leading-snug">{item.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-[#6b7289]">
                    {item.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Mockup showcase */}
      <section className="bg-[#eef1fb] px-6 py-11">
        <h2 className="text-center text-[22px] font-extrabold leading-snug">
          이런 정보들을
          <br />
          한 곳에서 찾아보세요
        </h2>
        <p className="mt-3 text-center text-[14px] leading-relaxed text-[#6b7289]">
          일자리·교육·취미 모두 필요한 정보를 상세하게 제공해요
        </p>

        <div className="mt-8 flex justify-center">
          <Image
            src={ASSETS.landingMockup}
            alt="오육이랑 활동 상세 화면 미리보기"
            width={591}
            height={1024}
            className="h-auto w-[min(336px,86vw)] drop-shadow-[0_20px_40px_rgba(91,109,191,0.25)]"
            priority
            unoptimized
          />
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white px-6 py-11">
        <h2 className="text-center text-[22px] font-extrabold">
          3분이면 시작할 수 있어요
        </h2>

        <ol className="mt-8 flex flex-col gap-6">
          {STEPS.map((step) => (
            <li key={step.num} className="flex items-start gap-[18px]">
              <div
                className="flex size-[60px] shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-[0_8px_16px_rgba(91,109,191,0.28)]"
                style={{ backgroundImage: CTA_GRADIENT }}
              >
                <span className="text-[10px] font-bold leading-none tracking-wide opacity-90">
                  STEP
                </span>
                <span className="mt-0.5 text-[18px] font-black leading-none">{step.num}</span>
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <h3 className="text-[17px] font-extrabold">{step.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-[#6b7289]">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Bottom CTA */}
      <section
        className="flex flex-col items-center px-6 py-11 text-white"
        style={{ backgroundImage: CTA_GRADIENT }}
      >
        <div className="flex size-[68px] items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
          <Image
            src={ASSETS.logoLanding}
            alt=""
            width={68}
            height={68}
            className="size-full object-cover"
          />
        </div>

        <h2 className="mt-5 text-center text-[26px] font-black leading-snug">
          지금 바로 시작해보세요
        </h2>
        <p className="mt-3 max-w-[220px] text-center text-[15px] leading-relaxed text-[#e4e7fb]">
          5060의 새로운 시작,
          <br />
          오육이랑이 함께합니다.
        </p>

        <Link
          href="/login"
          className="mt-7 flex h-[68px] w-full items-center justify-center gap-2 rounded-2xl bg-white text-[18px] font-black text-[#5b6dbf] shadow-[0_12px_15px_rgba(0,0,0,0.2)]"
        >
          로그인 / 회원가입하기
          <Image
            src={ASSETS.arrowRight}
            alt=""
            width={20}
            height={20}
            className="size-5"
            unoptimized
          />
        </Link>

        <p className="mt-5 text-center text-[13px] font-medium text-white/80">
          무료로 이용 가능해요 · 3분이면 시작 완료
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-[#1c1f2a] px-6 pb-10 pt-8 text-white">
        <div className="flex items-center gap-2.5">
          <div className="size-7 overflow-hidden rounded-lg bg-white">
            <Image
              src={ASSETS.logoLanding}
              alt=""
              width={28}
              height={28}
              className="size-full object-cover"
            />
          </div>
          <span className="text-[15px] font-bold">오육이랑</span>
        </div>
        <p className="mt-4 text-[13px] text-[#9ca0ac]">
          5060 시니어를 위한 맞춤 플랫폼
        </p>
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-[12px] text-[#6b7280]">
            © 2026 오육이랑. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

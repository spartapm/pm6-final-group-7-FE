import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";

/** SCR-000 랜딩 — Figma 1:1860 + 7/20 CTA 2버튼 유지 */
export default function LandingPage() {
  return (
    <div
      className="flex min-h-dvh flex-col px-6 pb-[60px] pt-[52px] text-white"
      style={{
        backgroundImage:
          "linear-gradient(156deg, #5b6dbf 0%, #7c8ce4 55%, #9ba9ec 100%)",
      }}
    >
      <div className="flex justify-center">
        <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[26px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
          <Image
            src={ASSETS.logoLanding}
            alt="오육이랑 로고"
            width={88}
            height={88}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      </div>

      <h1 className="mt-3 text-center text-[32px] font-black leading-[1.3]">
        5060의 새로운 시작,
        <br />
        오육이랑과 함께
      </h1>

      <p className="mt-4 text-center text-[19px] leading-[1.6] text-[#e4e7fb]">
        흩어진 일자리·교육·취미 정보를
        <br />
        한 곳에서.
        <br />
        내 상황에 딱 맞는 활동을 쉽게
        <br />
        찾고 신청하세요.
      </p>

      <Link
        href="/onboarding/region"
        className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white px-[18px] py-5 text-[20px] font-black text-primary shadow-[0_12px_15px_rgba(0,0,0,0.2)]"
      >
        서비스 둘러보기
        <Image src={ASSETS.arrowRight} alt="" width={20} height={20} unoptimized />
      </Link>

      <Link
        href="/login"
        className="mt-3 flex items-center justify-center rounded-2xl border-2 border-white/80 bg-transparent px-[18px] py-4 text-[18px] font-bold text-white"
      >
        로그인하기
      </Link>

      <p className="mt-8 text-center text-base font-bold text-white/85">무료 · 3분이면 시작</p>
    </div>
  );
}

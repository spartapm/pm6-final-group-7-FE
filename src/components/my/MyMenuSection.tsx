"use client";

interface MyMenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export function MyMenuSection({ title, children }: MyMenuSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <p className="px-5 pb-1 pt-4 text-[14px] font-bold text-[#9096a6]">{title}</p>
      <div>{children}</div>
    </section>
  );
}

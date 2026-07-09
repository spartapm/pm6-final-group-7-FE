import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "오육이랑",
  description: "5060의 새로운 시작, 오육이랑과 함께",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <ToastProvider>
            <div className="mobile-shell">{children}</div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

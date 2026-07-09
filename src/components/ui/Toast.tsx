"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ToastItem { id: number; message: string }

const ToastContext = createContext<{ show: (msg: string) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="mobile-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

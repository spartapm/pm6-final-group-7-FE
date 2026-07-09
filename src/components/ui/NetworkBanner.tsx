"use client";

import { useEffect, useState } from "react";

export function NetworkBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-deadline-urgent px-4 py-2 text-center text-sm font-semibold text-white">
      인터넷 연결을 확인해주세요.
    </div>
  );
}

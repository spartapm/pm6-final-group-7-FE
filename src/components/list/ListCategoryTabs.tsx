"use client";

interface Tab {
  id: string;
  label: string;
}

interface ListCategoryTabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ListCategoryTabs({ tabs, activeId, onChange }: ListCategoryTabsProps) {
  return (
    <div className="flex border-b border-[#eceef2] bg-white">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 py-3.5 text-[17px] font-bold transition ${
              active ? "text-primary" : "text-[#9ca3af]"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-[18%] bottom-0 h-[3px] rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

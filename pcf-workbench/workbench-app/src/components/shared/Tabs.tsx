import React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => (
  <div className="flex border-b border-wb-border">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px
          ${activeTab === tab.id
            ? "text-[#4f6ef7] border-[#4f6ef7]"
            : "text-wb-text2 border-transparent hover:text-wb-text"
          }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

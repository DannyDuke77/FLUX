"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, HandCoins, Network, UserCircle2, Settings as SettingsIcon } from "lucide-react";
import BusinessDetails from "./components/BusinessDetails";
import DepartmentSettings from "./components/DepartmentSettings";

const TABS = [
  { id: "business", label: "Business Profile", icon: Building2 },
  { id: "departments", label: "Departments", icon: Network },
];

const SettingsPage = ({ user, departments }: { user: any; departments: any[] }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get the active tab directly from the URL
  const activeTab = searchParams.get("tab") || "business";

  // Function to update the tab by updating the URL
  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/settings?${params.toString()}`, { scroll: false });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "business": return <BusinessDetails user={user} />;
      case "departments": return <DepartmentSettings departments={departments} />;
      default: return <BusinessDetails user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <SettingsIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
              <p className="text-gray-400 mt-1">Manage your business profile and system preferences</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-1 border-b border-gray-800/60">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative group ${
                    isActive
                      ? "text-blue-400 border-b-2 border-blue-400 bg-gradient-to-t from-blue-500/5 to-transparent"
                      : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent hover:border-gray-700"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-blue-400" : "group-hover:text-gray-300"} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
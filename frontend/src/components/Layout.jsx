import React, { useState } from "react";
import {
  Home,
  Building2,
  Users,
  CreditCard,
  Settings,
  Menu,
  Bell,
} from "lucide-react";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: <Home size={16} />, href: "/dashboard" },
    { name: "Properties", icon: <Building2 size={16} />, href: "/properties" },
    { name: "Tenants", icon: <Users size={16} />, href: "/tenants" },
    { name: "Payments", icon: <CreditCard size={16} />, href: "/payments" },
    { name: "Settings", icon: <Settings size={16} />, href: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-[#121417] text-[#F3F4F6] font-inter">
      {/* Sidebar */}
      <div
        className={`fixed z-40 inset-y-0 left-0 w-64 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static transition-transform duration-300 ease-in-out bg-[#1F2327] overflow-y-auto`}
      >
        <div className="p-4 text-lg font-bold tracking-wide text-white">
          PortfolioPilot
        </div>
        <nav className="mt-4 space-y-1 px-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-[#2A2E33] transition-colors"
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 ml-0 md:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 backdrop-blur bg-[#121417]/80 border-b border-[#2A2E33] px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-[#F3F4F6]"
          >
            <Menu />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-1.5 text-sm rounded-full transition">
              + Add Property
            </button>
            <Bell className="text-[#F3F4F6]" size={18} />
            <div className="w-9 h-9 rounded-full bg-gray-400 overflow-hidden">
              <img
                src="https://i.pravatar.cc/36?img=8"
                alt="profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-y-auto flex-1">{children}</main>
      </div>
    </div>
  );
}

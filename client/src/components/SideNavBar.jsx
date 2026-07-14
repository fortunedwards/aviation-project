import React from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
} from 'lucide-react';

const NAV_ITEMS = {
  Student: [
    { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
    { label: 'Finance', icon: CreditCard, tab: 'finance' },
    { label: 'Documents', icon: FileText, tab: 'documents' },
    { label: 'Calendar', icon: CalendarDays, tab: 'calendar' },
  ],
  Admin: [
    { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
    { label: 'Applications', icon: ClipboardList, tab: 'applications' },
    { label: 'Payments', icon: CreditCard, tab: 'payments' },
    { label: 'Chat', icon: MessageSquare, tab: 'chat' },
    { label: 'Calendar', icon: CalendarDays, tab: 'calendar' },
  ],
  Instructor: [
    { label: 'Review Queue', icon: ClipboardCheck, tab: 'queue' },
    { label: 'Calendar', icon: CalendarDays, tab: 'calendar' },
  ],
  Manager: [
    { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
    { label: 'Admissions', icon: ClipboardList, tab: 'applications' },
    { label: 'Calendar', icon: CalendarDays, tab: 'calendar' },
    { label: 'Staff Registry', icon: Users, tab: 'staff' },
    { label: 'Audit Trails', icon: History, tab: 'logs' },
  ],
};

const SideNavBar = ({ role, activeTab, onTabChange, onLogout }) => {
  const items = NAV_ITEMS[role] || [];
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside
      className={`relative sticky top-20 mt-20 flex h-[calc(100vh-5rem)] shrink-0 flex-col justify-between border-r border-slate-200 bg-white py-6 shadow-xl shadow-slate-200/70 transition-all duration-300 ${
        isCollapsed ? 'w-24' : 'w-72'
      }`}
    >
      <button
        type="button"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={() => setIsCollapsed((current) => !current)}
        className={`absolute -right-3 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-md shadow-slate-200/70 transition-all duration-300 hover:border-[#99D2F2] hover:text-[#2095D3] ${
          isCollapsed ? 'rotate-0' : 'rotate-0'
        }`}
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={2.6} /> : <ChevronLeft size={14} strokeWidth={2.6} />}
      </button>

      <div className="flex flex-col gap-3">

        <div className={`flex w-full flex-col ${isCollapsed ? 'items-center gap-4 px-2' : 'gap-3 px-4'}`}>
          {items.map(({ label, icon, tab }) => {
            const isActive = activeTab === tab;
            const Icon = icon;
            return (
              <button
                key={tab}
                type="button"
                title={label}
                onClick={() => onTabChange?.(tab)}
                className={`group relative flex items-center rounded-2xl transition-all duration-300 ${
                  isCollapsed
                    ? `w-14 justify-center px-2 py-3 ${
                        isActive
                          ? 'translate-x-1 bg-[#2095D3] text-white shadow-[0_0_20px_rgba(32,149,211,0.38)]'
                          : 'scale-95 text-slate-500 hover:scale-100 hover:bg-sky-50 hover:text-[#2095D3] active:scale-90'
                      }`
                    : `w-full gap-4 px-4 py-3 text-left ${
                        isActive
                          ? 'translate-x-1 bg-[#2095D3] text-white shadow-[0_0_20px_rgba(32,149,211,0.38)]'
                          : 'text-slate-600 hover:bg-sky-50 hover:text-[#2095D3]'
                      }`
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    isActive ? 'bg-white/14 text-white' : 'text-slate-500 group-hover:text-[#2095D3]'
                  }`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                {!isCollapsed && (
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {label}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {onLogout && (
        <div className={isCollapsed ? 'px-2' : 'px-4'}>
          {!isCollapsed && (
            <div className="mb-3 border-t border-slate-200" />
          )}
          <button
            onClick={onLogout}
            type="button"
            title="Logout"
            className={`group flex rounded-2xl text-slate-500 transition-all duration-300 hover:bg-sky-50 hover:text-[#2095D3] active:scale-95 ${
              isCollapsed ? 'mx-auto w-14 justify-center px-2 py-3' : 'w-full items-center gap-4 px-4 py-3'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors group-hover:text-[#2095D3]">
              <LogOut size={20} strokeWidth={2.2} />
            </span>
            {!isCollapsed && (
              <span>
                <span className="block text-sm font-semibold">Logout</span>
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

export default SideNavBar;


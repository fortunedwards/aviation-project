import React from 'react';
import { Bell } from 'lucide-react';

const ROLE_LABELS = {
  Admin: 'Administrator',
  Student: 'Student',
  Instructor: 'Instructor',
  Manager: 'Accountable Manager',
};

const getDisplayName = (value) => {
  if (!value) return 'Aeroconsult User';
  const cleaned = value.trim();
  return cleaned || 'Aeroconsult User';
};

const getInitials = (name) => {
  if (!name) return 'AU';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const TopNavBar = ({
  role,
  userName = 'Aeroconsult User',
  brand = 'AEROCONSULT LTD.',
  notificationCount = 1,
  onNotificationsClick,
  children,
}) => {
  const roleLabel = ROLE_LABELS[role] || role || 'Dashboard User';
  const hasNotifications = notificationCount > 0;
  const displayName = getDisplayName(userName);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md transition-all duration-200 md:px-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/aeroconsult_logo.jpg"
            alt="Aeroconsult logo"
            className="h-10 w-10 rounded-full object-cover border border-[#99D2F2] shadow-sm"
          />
          <span className="text-xl font-black tracking-tight text-slate-900">{brand}</span>
        </div>
        {children && (
          <div className="ml-4 hidden items-center gap-6 md:flex">
            {children}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative rounded-full p-2 transition-all duration-200 hover:bg-slate-100 active:scale-95"
          title="Notifications"
        >
          <Bell size={20} className="text-slate-600" strokeWidth={2.2} />
          {hasNotifications && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          )}
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{roleLabel}</p>
          </div>

          <div className="relative cursor-pointer transition-transform active:scale-95">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm">
              {getInitials(displayName)}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Route, Search, Shield, Target, UserRound } from 'lucide-react';
import SelectField from '../components/context/SelectField';

const parseAuditMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const formatActionType = (value) =>
  String(value || 'Unknown action')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatRole = (value) =>
  String(value || 'System')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTimestamp = (value) => {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString();
};

const getActionTone = (actionType) => {
  if (String(actionType).includes('DELETED') || String(actionType).includes('REJECTED')) return 'bg-rose-50 text-rose-700';
  if (String(actionType).includes('UPDATED') || String(actionType).includes('ASSIGNMENT')) return 'bg-amber-50 text-amber-700';
  if (String(actionType).includes('CREATED') || String(actionType).includes('APPROVED')) return 'bg-emerald-50 text-emerald-700';
  return 'bg-sky-50 text-sky-700';
};

const AuditLogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const metadata = parseAuditMetadata(log.metadata);
  const actorName = log.staff_name || log.actor_name || metadata.actor_name || 'System';
  const actorRole = log.actor_role || metadata.actor_role || log.actor_type || metadata.actor_type || 'System';
  const targetType = log.target_type || metadata.target_type;
  const targetId = log.target_id || metadata.target_id;
  const route = log.route || log.request_method || metadata.route || metadata.method
    ? `${log.request_method || metadata.method || 'REQUEST'} ${log.route || metadata.route || ''}`.trim()
    : null;
  const statusCode = log.status_code ?? metadata.status_code ?? null;
  const hasSnapshot = Boolean(log.entity_before || log.entity_after || metadata.entity_before || metadata.entity_after);
  const technicalContext = [
    ['Actor type', formatRole(log.actor_type || metadata.actor_type || 'system')],
    ['IP address', log.ip_address || metadata.ip_address || 'Not captured'],
    ['User agent', log.user_agent || metadata.user_agent || 'Not captured'],
    ['Route', route || 'Not captured'],
    ['Target', targetType ? `${formatRole(targetType)}${targetId ? ` · ${targetId}` : ''}` : 'Not captured'],
    ['Status code', statusCode || 'Not captured'],
  ];

  return (
    <>
      <tr className="group border-t border-sky-50 align-top transition-colors hover:bg-sky-50/40">
        <td className="px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#99D2F2] text-[#2B2A4C]">
              <UserRound size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#2B2A4C]">{actorName}</p>
              <p className="mt-1 text-xs text-slate-500">{formatRole(actorRole)}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${getActionTone(log.action_type)}`}>
                {formatActionType(log.action_type)}
              </span>
              {statusCode && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">{statusCode}</span>}
            </div>
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-slate-800">{log.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {targetType && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                    <Target size={12} />
                    {formatRole(targetType)}
                    {targetId && <span>{targetId}</span>}
                  </span>
                )}
                {route && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                    <Route size={12} />
                    {route}
                  </span>
                )}
                {hasSnapshot && <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">Snapshot available</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{formatTimestamp(log.created_at)}</p>
              <p className="mt-1 text-xs text-slate-500">Captured event time</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-white text-slate-400 transition hover:border-sky-200 hover:text-sky-600 ${expanded ? 'rotate-180 text-sky-600' : ''}`}
              aria-label={expanded ? 'Hide audit details' : 'Show audit details'}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-sky-50 bg-slate-50/70">
          <td colSpan={3} className="px-8 py-5">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-sky-100 bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Technical Context</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {technicalContext.map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                      <p className="mt-2 break-words text-sm text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-sky-100 bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Audit Payload</p>
                <pre className="mt-4 max-h-72 overflow-auto rounded-[20px] bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(metadata, null, 2)}</pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const AuditTrailsPanel = ({ logs = [] }) => {
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);

  const auditActionOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(logs.map((log) => log.action_type).filter(Boolean)))],
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = auditFilter === 'ALL' ? true : log.action_type === auditFilter;
      const haystack = [log.staff_name, log.actor_name, log.actor_role, log.description, log.action_type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = auditSearch.trim() ? haystack.includes(auditSearch.trim().toLowerCase()) : true;
      return matchesAction && matchesSearch;
    });
  }, [logs, auditFilter, auditSearch]);

  const auditPageSize = 25;
  const auditTotalPages = Math.max(1, Math.ceil(filteredLogs.length / auditPageSize));
  const safeAuditPage = Math.min(auditPage, auditTotalPages);
  const paginatedLogs = useMemo(() => {
    const startIndex = (safeAuditPage - 1) * auditPageSize;
    return filteredLogs.slice(startIndex, startIndex + auditPageSize);
  }, [filteredLogs, safeAuditPage]);
  const auditVisiblePages = Array.from({ length: auditTotalPages }, (_, index) => index + 1);
  const auditStart = filteredLogs.length === 0 ? 0 : (safeAuditPage - 1) * auditPageSize + 1;
  const auditEnd = Math.min(safeAuditPage * auditPageSize, filteredLogs.length);

  return (
    <div className="w-full rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.16),transparent_32%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">Audit Trail</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">Review System Activity</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Track the user, action details, and event timestamp across admissions, staff operations, authentication, and other protected workflows.
            </p>
          </div>
          <div className="rounded-[24px] border border-sky-100/90 bg-white px-5 py-4 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Recorded Events</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-[#2B2A4C]">{String(filteredLogs.length).padStart(2, '0')}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-sky-100/90 bg-white shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
          <div className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(240,248,253,0.82))] px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[540px]">
                <div className="group relative">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2095D3]" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(1);
                    }}
                    placeholder="Search user, role, or action..."
                    className="w-full rounded-[20px] border border-sky-100 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2095D3] focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <SelectField
                  id="audit-action-filter"
                  name="auditActionFilter"
                  value={auditFilter}
                  onChange={(e) => {
                    setAuditFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="All action types"
                  searchable
                >
                  {auditActionOptions.map((actionType) => (
                    <option key={actionType} value={actionType}>
                      {actionType === 'ALL' ? 'All action types' : formatActionType(actionType)}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {paginatedLogs.length > 0 ? (
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">User</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Action</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <AuditLogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                  <Shield size={28} />
                </div>
                <p className="mt-6 text-xl font-bold text-slate-900">No audit events found</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">Try changing the action filter or search term to broaden the result set.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-sky-100 bg-slate-50/60 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Showing {auditStart} to {auditEnd} of {filteredLogs.length} audit events</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuditPage((current) => Math.max(1, current - 1))}
                disabled={safeAuditPage === 1}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              {auditVisiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setAuditPage(pageNumber)}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    safeAuditPage === pageNumber
                      ? 'border border-sky-100 bg-white font-bold text-sky-600 shadow-sm'
                      : 'border border-transparent text-slate-600 hover:border-sky-100 hover:bg-white'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAuditPage((current) => Math.min(auditTotalPages, current + 1))}
                disabled={safeAuditPage === auditTotalPages}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuditTrailsPanel;

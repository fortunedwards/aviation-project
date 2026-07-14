import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Clock3, MessageSquareMore, RefreshCw, Search, UserCheck2, X } from 'lucide-react';
import AdminChatWindow from './AdminChatWindow';
import AdmissionsWorkspace from '../components/AdmissionsWorkspace';
import ReviewModal from '../components/ReviewModal';
import { useSocket } from '../components/SocketContext';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';
import CalendarPage from './CalendarPage';
import AdminPaymentsPage from './AdminPaymentsPage';
import { usePopup } from '../components/context/PopupProvider';

const getUserDisplayName = (user) =>
  user?.name ||
  user?.full_name ||
  [user?.surname, user?.other_names].filter(Boolean).join(' ').trim() ||
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
  'Admin';

const formatRelativeStamp = (value) => {
  if (!value) return 'No messages yet';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getPreviewText = (conversation, adminId) => {
  const senderLabel = conversation.conversation_type === 'guest' ? 'Guest' : 'Student';
  if (conversation.last_file_type === 'image') {
    return conversation.last_sender_id === adminId ? 'You sent an image' : `${senderLabel} sent an image`;
  }
  if (conversation.last_file_type === 'document') {
    return conversation.last_sender_id === adminId ? 'You sent a document' : `${senderLabel} sent a document`;
  }
  if (conversation.last_message) {
    return conversation.last_sender_id === adminId ? `You: ${conversation.last_message}` : conversation.last_message;
  }
  return 'No messages yet';
};

const statusTone = (active) => (active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700');
const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

const AdminDashboard = ({ logout }) => {
  const popup = usePopup();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [endingSession, setEndingSession] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const { socket } = useSocket();

  const userString = localStorage.getItem('user');
  const adminUser = userString ? JSON.parse(userString) : null;
  const adminId = adminUser?.id || null;
  const adminName = getUserDisplayName(adminUser);
  const token = localStorage.getItem('token');

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = res.data.data || [];
      setConversations(items);
      setSelectedConversation((current) => {
        if (!current) return current;
        return items.find((item) => item.room_id === current.room_id) || null;
      });
    } catch (err) {
      console.error('Conversation fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await api.get('/api/applications/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data.data || []);
    } catch (err) {
      console.error('Applications fetch error', err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const markConversationRead = async (roomId) => {
    try {
      await api.post(`/api/chat/read/${roomId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Mark read error', err);
    }
  };

  const openConversation = async (conversation, switchToChat = false) => {
    setSelectedConversation(conversation);
    setConversations((current) =>
      current.map((item) => (item.room_id === conversation.room_id ? { ...item, unread_count: 0 } : item))
    );
    await markConversationRead(conversation.room_id);
    if (switchToChat) setActiveTab('chat');
  };

  const endChatSession = () => {
    if (!socket || !selectedConversation) return;
    setEndingSession(true);
    socket.emit(
      'end_chat_session',
      { studentId: selectedConversation.student_user_id, roomId: selectedConversation.room_id },
      (response) => {
      setEndingSession(false);
      if (!response?.success) {
        console.error(response?.message || 'Unable to end chat session');
        return;
      }
      setConversations((current) =>
        current.map((item) =>
          item.room_id === selectedConversation.room_id ? { ...item, session_active: false } : item
        )
      );
      }
    );
  };

  const deleteChatSession = async () => {
    if (!socket || !selectedConversation) return;
    const confirmed = await popup.confirm({
      title: 'Delete Chat Session',
      message: 'Delete this chat session and all messages permanently? This action cannot be undone.',
      confirmText: 'Delete Chat',
      cancelText: 'Cancel',
      kind: 'warning',
    });
    if (!confirmed) return;

    setDeletingSession(true);
    socket.emit(
      'delete_chat_session',
      { studentId: selectedConversation.student_user_id, roomId: selectedConversation.room_id },
      async (response) => {
        setDeletingSession(false);
        if (!response?.success) {
          console.error(response?.message || 'Unable to delete chat session');
          return;
        }
        setSelectedConversation(null);
        await fetchConversations();
      }
    );
  };

  useEffect(() => {
    fetchConversations();
    fetchApplications();
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      fetchConversations();
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const handleNewUnread = ({ roomId }) => {
      if (selectedConversation?.room_id === roomId) {
        markConversationRead(roomId).then(() => fetchConversations()).catch(() => {});
        return;
      }
      fetchConversations();
    };
    const handleReceiveMessage = ({ room }) => {
      if (selectedConversation?.room_id === room) markConversationRead(room).catch(() => {});
      fetchConversations();
    };
    const handleSessionStarted = ({ roomId }) => {
      setConversations((current) =>
        current.map((item) => (item.room_id === roomId ? { ...item, session_active: true } : item))
      );
      fetchConversations();
    };
    const handleSessionEnded = ({ roomId }) => {
      setConversations((current) =>
        current.map((item) => (item.room_id === roomId ? { ...item, session_active: false } : item))
      );
      fetchConversations();
    };
    const handleSessionDeleted = ({ roomId }) => {
      setConversations((current) => current.filter((item) => item.room_id !== roomId));
      setSelectedConversation((current) => (current?.room_id === roomId ? null : current));
      fetchConversations();
    };
    socket.on('new_unread', handleNewUnread);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('chat_session_started', handleSessionStarted);
    socket.on('chat_session_ended', handleSessionEnded);
    socket.on('chat_session_deleted', handleSessionDeleted);
    return () => {
      socket.off('new_unread', handleNewUnread);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('chat_session_started', handleSessionStarted);
      socket.off('chat_session_ended', handleSessionEnded);
      socket.off('chat_session_deleted', handleSessionDeleted);
    };
  }, [socket, selectedConversation]);

  const filteredConversations = useMemo(() => {
    const query = chatSearchTerm.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const fullName = `${conversation.surname || ''} ${conversation.other_names || ''}`.toLowerCase();
      return (
        fullName.includes(query) ||
        String(conversation.email || '').toLowerCase().includes(query) ||
        String(conversation.course_name || '').toLowerCase().includes(query)
      );
    });
  }, [conversations, chatSearchTerm]);

  const totalUnread = conversations.reduce((sum, item) => sum + (item.unread_count || 0), 0);
  const activeSessions = conversations.filter((item) => item.session_active).length;
  const selectedStudent = selectedConversation
    ? {
        id: selectedConversation.student_user_id,
        room_id: selectedConversation.room_id,
        surname: selectedConversation.surname,
        other_names: selectedConversation.other_names,
        email: selectedConversation.email,
        phone: selectedConversation.phone,
        course_name: selectedConversation.course_name,
        conversation_type: selectedConversation.conversation_type,
        is_registered_student: selectedConversation.is_registered_student,
        is_approved_student: selectedConversation.is_approved_student,
      }
    : null;

  const applicationConversationMap = useMemo(
    () => new Map(conversations.map((conversation) => [String(conversation.application_id), conversation])),
    [conversations]
  );

  const dashboardSummary = useMemo(() => {
    const paidCount = applications.filter((app) => String(app.payment_status || '').toLowerCase() === 'paid').length;
    const approvedCount = applications.filter((app) => String(app.admission_status || '').toLowerCase() === 'approved').length;
    const pendingReviewCount = applications.filter((app) => String(app.admission_status || '').toLowerCase() === 'pending').length;
    const tuitionExpected = applications.reduce((sum, app) => sum + Number(app.course_fee || 0), 0);

    const byCourse = applications.reduce((acc, app) => {
      const course = app.course_name || 'No course assigned';
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {});
    const topCourses = Object.entries(byCourse)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([course, count]) => ({ course, count }));

    const recentApplications = [...applications]
      .sort((a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0))
      .slice(0, 6);

    const recentConversations = [...conversations]
      .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
      .slice(0, 6);

    return {
      paidCount,
      approvedCount,
      pendingReviewCount,
      tuitionExpected,
      topCourses,
      recentApplications,
      recentConversations,
    };
  }, [applications, conversations]);

  const renderDashboardTab = () => (
    <div className="w-full rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.14),transparent_34%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">Admin Command Center</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">Operations Overview</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Monitor admissions workload, payment coverage, and support responsiveness from one central workspace.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Applications</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-[#2B2A4C]">{applications.length}</p>
          </article>
          <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Pending Review</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-amber-600">{dashboardSummary.pendingReviewCount}</p>
          </article>
          <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Approved</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-emerald-600">{dashboardSummary.approvedCount}</p>
          </article>
          <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Unread Chats</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-[#2095D3]">{totalUnread}</p>
          </article>
          <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Tuition Exposure</p>
            <p className="mt-4 text-2xl font-black tracking-tight text-[#2B2A4C]">{formatCurrency(dashboardSummary.tuitionExpected)}</p>
          </article>
        </section>

        <section>
          <div className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Recent Applications</p>
            <div className="mt-4 space-y-3">
              {dashboardSummary.recentApplications.length === 0 && <p className="text-sm text-slate-500">No applications available.</p>}
              {dashboardSummary.recentApplications.map((app) => (
                <div key={app.id} className="flex items-start justify-between gap-3 rounded-2xl border border-sky-100 bg-slate-50/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{[app.surname, app.other_names].filter(Boolean).join(' ') || app.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{app.course_name || 'No course assigned'}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${String(app.admission_status || '').toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-700' : String(app.admission_status || '').toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {app.admission_status || 'unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
          <div className="flex items-center gap-2">
            <UserCheck2 size={16} className="text-[#2095D3]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Top Course Demand</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {dashboardSummary.topCourses.length === 0 && <p className="text-sm text-slate-500">No course demand data yet.</p>}
            {dashboardSummary.topCourses.map((item) => (
              <div key={item.course} className="rounded-2xl border border-sky-100 bg-slate-50/70 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{item.course}</p>
                <p className="mt-1 text-xs text-slate-500">{item.count} applicants</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={fetchApplications}
          disabled={applicationsLoading}
          className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-sky-50 hover:text-[#2095D3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={applicationsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      <AdmissionsWorkspace
        applications={applications}
        title="Applications"
        subtitle="Review student submissions and jump directly into support conversations."
        showCourseFilter
        onReview={setSelectedApplication}
        reviewLabel="View Details"
        secondaryAction={(application) => {
          const matchingConversation = applicationConversationMap.get(String(application.id));
          return (
            <button
              type="button"
              onClick={() => matchingConversation && openConversation(matchingConversation, true)}
              disabled={!matchingConversation}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-[#2095D3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1A7BB1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquareMore size={16} />
              {matchingConversation ? 'Start Conversation' : 'Conversation Unavailable'}
            </button>
          );
        }}
        className={applicationsLoading ? 'opacity-70 pointer-events-none' : ''}
      />
    </div>
  );

  const renderChatTab = () => (
    <div className="space-y-6">
      <div className="mb-2 flex justify-end">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="app-subcard"><p className="app-subcard-label">Unread</p><p className="app-subcard-value">{totalUnread}</p></div>
          <div className="app-subcard"><p className="app-subcard-label">Active Sessions</p><p className="app-subcard-value">{activeSessions}</p></div>
        </div>
      </div>

      <div className="grid min-h-[70vh] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="app-card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search conversations"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                value={chatSearchTerm}
                onChange={(e) => setChatSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[calc(70vh-88px)] overflow-y-auto">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                <Clock3 className="mb-3 animate-pulse" size={22} />
                <p className="text-sm font-semibold">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-8 text-center text-slate-400">
                <MessageSquareMore className="mb-4 text-slate-300" size={28} />
                <p className="text-sm font-semibold text-slate-500">No conversations found</p>
                <p className="mt-2 text-xs text-slate-400">Try a different student name, email, or course title.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isSelected = selectedConversation?.room_id === conversation.room_id;
                const preview = getPreviewText(conversation, adminId);
                const name = `${conversation.surname || ''} ${conversation.other_names || ''}`.trim();
                return (
                  <button
                    key={conversation.room_id}
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition-all hover:bg-sky-50/70 ${isSelected ? 'bg-sky-50' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{name || conversation.email}</p>
                        <p className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                              conversation.conversation_type === 'guest'
                                ? 'bg-slate-200 text-slate-700'
                                : conversation.is_approved_student
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {conversation.conversation_type === 'guest'
                              ? (conversation.is_registered_student ? 'Guest (Registered)' : 'Guest')
                              : (conversation.is_approved_student ? 'Student (Approved)' : 'Student')}
                          </span>
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">{conversation.course_name || 'No course assigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-slate-400">{formatRelativeStamp(conversation.last_message_at)}</p>
                        {conversation.unread_count > 0 && (
                          <span className="mt-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-500 px-2 text-[10px] font-bold text-white">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 truncate text-sm text-slate-600">{preview}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(conversation.session_active)}`}>
                        {conversation.session_active ? 'Session Active' : 'Awaiting Session'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="app-card overflow-hidden">
          {selectedConversation && selectedStudent ? (
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Selected Conversation</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                    {selectedConversation.surname} {selectedConversation.other_names}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedConversation.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={endChatSession}
                    disabled={endingSession || !selectedConversation.session_active}
                    className="rounded-full border border-rose-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {endingSession ? 'Ending...' : 'End Session'}
                  </button>
                  <button
                    type="button"
                    onClick={deleteChatSession}
                    disabled={deletingSession}
                    className="rounded-full border border-rose-300 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deletingSession ? 'Deleting...' : 'Delete Chat'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedConversation(null)}
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1">
                <AdminChatWindow student={selectedStudent} adminId={adminId} />
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[70vh] flex-col items-center justify-center px-8 text-center text-slate-400">
              <MessageSquareMore size={34} className="mb-4 text-slate-300" />
              <p className="text-lg font-bold text-slate-600">Select a conversation</p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Pick a student from the inbox to view the message history, session state, and support actions.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideNavBar role="Admin" activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
      <TopNavBar role="Admin" userName={adminName} notificationCount={totalUnread} />
      <main className="flex-1 px-6 pb-6 pt-24 md:px-8 md:pb-8 md:pt-28">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'applications' && renderApplicationsTab()}
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'payments' && <AdminPaymentsPage />}
        {activeTab === 'calendar' && (
          <CalendarPage
            title="Admin Calendar"
            subtitle="Plan payment windows, admissions checkpoints, and student support sessions."
          />
        )}
      </main>

      {selectedApplication && (
        <ReviewModal
          app={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          readOnly
        />
      )}
    </div>
  );
};

export default AdminDashboard;

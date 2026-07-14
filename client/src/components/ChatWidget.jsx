import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import {
  Bot,
  Check,
  CheckCheck,
  FileText,
  Headset,
  Loader2,
  MessageCircleMore,
  Paperclip,
  SendHorizontal,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useSocket } from './SocketContext.jsx';

const MessageStatus = ({ status }) => (
  <span className="ml-1 inline-flex opacity-70">
    {status === 'delivered' ? <CheckCheck size={12} strokeWidth={2.2} /> : <Check size={12} strokeWidth={2.2} />}
  </span>
);

const MessageContent = ({ msg, isMine }) => {
  if (msg.fileType === 'image') {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noreferrer">
        <img src={msg.fileUrl} alt="attachment" className="mb-1 max-w-[180px] cursor-pointer rounded-xl hover:opacity-90" />
      </a>
    );
  }
  if (msg.fileType === 'document') {
    const fileName = msg.fileUrl?.split('/').pop() || 'document';
    return (
      <a
        href={msg.fileUrl}
        target="_blank"
        rel="noreferrer"
        className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 transition ${
          isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-[#2B2A4C]/10 hover:bg-[#2B2A4C]/20'
        }`}
      >
        <FileText size={14} />
        <span className="max-w-[130px] truncate text-xs">{fileName.replace(/^\d+-/, '')}</span>
      </a>
    );
  }
  return <span>{msg.message}</span>;
};

const ChatWidget = ({ user }) => {
  const GUEST_FORM_STORAGE_KEY = 'guest_chat_form_v1';
  const isAuthenticated = Boolean(user?.id);
  const { socket, loading } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [sessionNotice, setSessionNotice] = useState('');
  const [sessionActive, setSessionActive] = useState(false);

  const [guestProfile, setGuestProfile] = useState(null);
  const [guestForm, setGuestForm] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(GUEST_FORM_STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        return {
          name: String(saved.name || ''),
          email: String(saved.email || ''),
          phone: String(saved.phone || ''),
        };
      }
    } catch {
      // ignore parse errors and fall back to defaults
    }
    return { name: '', email: '', phone: '' };
  });
  const [guestStarting, setGuestStarting] = useState(false);
  const [guestFormNotice, setGuestFormNotice] = useState('');
  const [guestBootstrapped, setGuestBootstrapped] = useState(false);

  const scrollRef = useRef();
  const isOpenRef = useRef(isOpen);
  const fileInputRef = useRef();

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated) return;
    sessionStorage.setItem(GUEST_FORM_STORAGE_KEY, JSON.stringify(guestForm));
  }, [guestForm, isAuthenticated]);

  const roomId = useMemo(() => {
    if (isAuthenticated) return `chat_${user.id}`;
    return guestProfile?.roomId || null;
  }, [isAuthenticated, user?.id, guestProfile?.roomId]);

  const mySenderId = isAuthenticated ? String(user?.id) : String(guestProfile?.guestSenderId || '');
  const hasGuestChat = !isAuthenticated && Boolean(guestProfile?.roomId && guestProfile?.guestToken);

  const guestHeaders = hasGuestChat ? { 'x-guest-token': guestProfile.guestToken } : {};

  const clearGuestChatState = (notice = '') => {
    setGuestProfile(null);
    setGuestForm({ name: '', email: '', phone: '' });
    setChatHistory([]);
    setSessionActive(false);
    setSessionNotice(notice);
    setGuestFormNotice('');
    setMessage('');
    setPreview(null);
    setGuestBootstrapped(false);
    setLoadingHistory(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchHistory = async (silent = false) => {
    if (!roomId) return;
    if (!silent) setLoadingHistory(true);
    try {
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        const res = await api.get(`/api/chat/history/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatHistory(res.data || []);
      } else {
        const res = await api.get(`/api/chat/guest/history/${roomId}`, {
          headers: guestHeaders,
        });
        setChatHistory(res.data || []);
      }
    } catch (err) {
      console.error('Error loading chat history', err);
      if (!isAuthenticated && [400, 401, 404].includes(Number(err?.response?.status))) {
        clearGuestChatState('This chat session is no longer available. Please start a new chat.');
      }
    } finally {
      if (!silent) {
        setLoadingHistory(false);
        setGuestBootstrapped(true);
      }
    }
  };

  const fetchSession = async () => {
    if (!roomId) return;
    try {
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        const res = await api.get(`/api/chat/session/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessionActive(Boolean(res.data?.data?.active));
      } else {
        const res = await api.get(`/api/chat/guest/session/${roomId}`, {
          headers: guestHeaders,
        });
        setSessionActive(Boolean(res.data?.data?.active));
      }
    } catch (err) {
      console.error('Error loading chat session', err);
      if (!isAuthenticated && [400, 401, 404].includes(Number(err?.response?.status))) {
        clearGuestChatState('This chat session is no longer available. Please start a new chat.');
      }
    }
  };

  useEffect(() => {
    if (!roomId) return;
    if (!isAuthenticated) setGuestBootstrapped(false);
    fetchHistory();
    fetchSession();
  }, [roomId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !roomId) return;
    const token = localStorage.getItem('token');
    axios
      .get('/api/chat/unread', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUnreadCount(res.data[roomId] || 0))
      .catch(() => {});
  }, [isAuthenticated, roomId]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    if (loading || !socket || !user?.id || !roomId) return undefined;

    socket.emit('join_room', { studentId: user.id });

    const handleReceiveMessage = (data) => {
      if (data.room === roomId) {
        setChatHistory((prev) => [...prev, data]);
        if (!isOpenRef.current) setUnreadCount((prev) => prev + 1);
      }
    };

    const handleDelivered = ({ roomId: deliveredRoom, messageIds }) => {
      if (deliveredRoom === roomId) {
        setChatHistory((prev) => prev.map((msg) => (messageIds.includes(msg.id) ? { ...msg, status: 'delivered' } : msg)));
      }
    };

    const handleSessionEnded = ({ roomId: endedRoom }) => {
      if (endedRoom === roomId) {
        setSessionActive(false);
        setSessionNotice('This chat session was ended by admin. Sending a new message will start a new session.');
      }
    };

    const handleSessionStarted = ({ roomId: startedRoom }) => {
      if (startedRoom === roomId) {
        setSessionActive(true);
        setSessionNotice('');
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_delivered', handleDelivered);
    socket.on('chat_session_ended', handleSessionEnded);
    socket.on('chat_session_started', handleSessionStarted);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_delivered', handleDelivered);
      socket.off('chat_session_ended', handleSessionEnded);
      socket.off('chat_session_started', handleSessionStarted);
    };
  }, [isAuthenticated, loading, socket, user?.id, roomId]);

  useEffect(() => {
    if (isAuthenticated || !hasGuestChat) return undefined;
    const poll = setInterval(() => {
      fetchHistory(true);
      fetchSession();
    }, 4000);
    return () => clearInterval(poll);
  }, [isAuthenticated, hasGuestChat, roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  const startGuestChat = async (e) => {
    e.preventDefault();
    if (!guestForm.name.trim() || !guestForm.email.trim() || !guestForm.phone.trim()) {
      setGuestFormNotice('Please complete name, email, and phone before starting chat.');
      return;
    }

    setGuestStarting(true);
    setGuestFormNotice('');
    try {
      const res = await api.post('/api/chat/guest/start', {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
      });

      const profile = res.data?.data;
      if (!profile?.roomId || !profile?.guestToken) throw new Error('Invalid guest chat response');

      setGuestProfile(profile);
      setSessionNotice(
        profile?.resumed
          ? 'Welcome back. Your previous chat has been restored.'
          : 'Secure chat started. Admin can now reply here.'
      );
      setGuestFormNotice('');
      sessionStorage.removeItem(GUEST_FORM_STORAGE_KEY);
      setGuestForm({ name: '', email: '', phone: '' });
    } catch (err) {
      console.error('Unable to start guest chat', err);
      setGuestFormNotice(err?.response?.data?.message || 'Unable to start chat right now. Please try again.');
    } finally {
      setGuestStarting(false);
    }
  };

  const resetGuestChat = () => {
    clearGuestChatState('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !roomId) return;
    setPreview({
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      localUrl: URL.createObjectURL(file),
      fileUrl: null,
      fileType: null,
    });
    setUploading(true);
    try {
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/api/chat/upload', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPreview((prev) => ({ ...prev, fileUrl: res.data.fileUrl, fileType: res.data.fileType }));
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', guestProfile.roomId);
        formData.append('guestToken', guestProfile.guestToken);
        const res = await api.post('/api/chat/upload-guest', formData);
        setPreview((prev) => ({ ...prev, fileUrl: res.data.fileUrl, fileType: res.data.fileType }));
      }
    } catch (err) {
      console.error('Upload error', err);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const sendFile = async () => {
    if (!preview?.fileUrl || !roomId) return;
    setSessionNotice('');
    try {
      if (isAuthenticated && socket) {
        socket.emit('send_message', {
          studentId: user.id,
          message: '',
          fileUrl: preview.fileUrl,
          fileType: preview.fileType,
        });
      } else if (!isAuthenticated) {
        await api.post('/api/chat/guest/send', {
          roomId: guestProfile.roomId,
          guestToken: guestProfile.guestToken,
          message: '',
          fileUrl: preview.fileUrl,
          fileType: preview.fileType,
        });
        await fetchHistory();
        await fetchSession();
      }

      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Send file failed', error);
      setSessionNotice('Unable to send attachment right now. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (message.trim() === '' || !roomId) return;
    setSessionNotice('');
    try {
      if (isAuthenticated && socket) {
        socket.emit('send_message', { studentId: user.id, message });
      } else if (!isAuthenticated) {
        await api.post('/api/chat/guest/send', {
          roomId: guestProfile.roomId,
          guestToken: guestProfile.guestToken,
          message,
        });
        await fetchHistory();
        await fetchSession();
      }

      setMessage('');
    } catch (error) {
      console.error('Send message failed', error);
      setSessionNotice('Unable to send message right now. Please try again.');
    }
  };

  useEffect(() => {
    const handleOpenSupportChat = () => {
      if (!isOpenRef.current) setIsOpen(true);
    };

    window.addEventListener('open_support_chat', handleOpenSupportChat);
    return () => window.removeEventListener('open_support_chat', handleOpenSupportChat);
  }, []);

  const handleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && unreadCount > 0 && isAuthenticated && roomId) {
      setUnreadCount(0);
      const token = localStorage.getItem('token');
      api.post(`/api/chat/read/${roomId}`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  };

  const isConnecting = isAuthenticated ? loading || loadingHistory : false;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-6">
      {isOpen && (
        <div className="flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex h-16 shrink-0 items-center justify-between bg-[#2B2A4C] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Headset size={18} className="text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">Support Chat</h3>
                <p className="text-xs uppercase tracking-widest text-white/70">{sessionActive ? 'Session Active' : 'Awaiting Session'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 transition-colors hover:text-white">
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          {!isAuthenticated && !hasGuestChat ? (
            <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={14} /> Secure chat setup
                </div>
                <p className="mt-1">Enter your details to start a chat room with admin.</p>
              </div>
              <form onSubmit={startGuestChat} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <input
                  value={guestForm.name}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2095D3]"
                  required
                />
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2095D3]"
                  required
                />
                <input
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2095D3]"
                  required
                />
                <button
                  type="submit"
                  disabled={guestStarting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2095D3] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1A7BB1] disabled:opacity-60"
                >
                  {guestStarting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {guestStarting ? 'Starting...' : 'Start Chat'}
                </button>
                {guestFormNotice && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    {guestFormNotice}
                  </p>
                )}
              </form>
            </div>
          ) : (
            <>
              {!isAuthenticated && hasGuestChat && (
                <div className="border-b border-slate-200 bg-white px-4 py-2">
                  <button
                    type="button"
                    onClick={resetGuestChat}
                    className="text-xs font-semibold text-slate-500 transition-colors hover:text-[#2095D3]"
                  >
                    Reset guest chat
                  </button>
                </div>
              )}
              <div className="flex flex-1 flex-col space-y-5 overflow-y-auto bg-slate-50 p-5">
                {isConnecting ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <Loader2 className="mb-2 animate-spin text-[#2B2A4C]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Connecting...</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => {
                    const isMine = String(msg.senderId) === mySenderId;
                    return (
                      <div key={msg.id || i} className={`flex w-[85%] items-start gap-3 ${isMine ? 'self-end flex-row-reverse' : ''}`}>
                        {!isMine && (
                          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2B2A4C]">
                            <Bot size={12} className="text-white" strokeWidth={2.2} />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isMine ? 'rounded-tr-sm bg-[#2B2A4C] text-white' : 'rounded-tl-sm bg-[#99D2F2] text-[#2B2A4C]'
                          }`}
                        >
                          <MessageContent msg={msg} isMine={isMine} />
                          <p className={`mt-1 flex items-center gap-0.5 text-[9px] opacity-60 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMine && <MessageStatus status={msg.status} />}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {preview && (
                <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-100 px-4 py-2">
                  {preview.type === 'image' ? <img src={preview.localUrl} className="h-8 w-8 rounded object-cover" alt="preview" /> : <FileText size={16} className="text-slate-500" />}
                  <span className="flex-1 truncate text-xs text-slate-600">{preview.name}</span>
                  {uploading ? (
                    <Loader2 size={12} className="animate-spin text-[#2B2A4C]" />
                  ) : (
                    <button onClick={sendFile} className="rounded-lg bg-[#2B2A4C] px-3 py-1 text-xs font-bold text-white">
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X size={16} className="text-slate-400" strokeWidth={2.2} />
                  </button>
                </div>
              )}

              {sessionNotice && <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">{sessionNotice}</div>}

              <div className="flex h-20 shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-4">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0 text-slate-400 transition-colors hover:text-[#2B2A4C]">
                  <Paperclip size={18} strokeWidth={2.2} />
                </button>
                <div className="flex h-12 flex-1 items-center rounded-xl border-b-2 border-transparent bg-slate-100 px-4 transition-colors focus-within:border-[#2B2A4C] focus-within:bg-white">
                  <input
                    className="w-full border-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-0"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B2A4C] text-white shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                >
                  <SendHorizontal size={18} strokeWidth={2.4} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleOpen}
        className="relative flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl transition-transform hover:-translate-y-1"
      >
        <MessageCircleMore size={28} className="text-[#2095D3]" strokeWidth={2.2} />
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500">
            <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;

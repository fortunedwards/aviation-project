import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Send, Loader2, Check, CheckCheck, Paperclip, FileText, X, MessageSquareMore } from 'lucide-react';
import { useSocket } from '../components/SocketContext';

const MessageStatus = ({ status, isMine }) => {
  if (!isMine) return null;
  return status === 'delivered' ? (
    <CheckCheck size={12} className="text-sky-200" />
  ) : (
    <Check size={12} className="text-slate-300" />
  );
};

const MessageContent = ({ msg, isMine }) => {
  if (msg.fileType === 'image') {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block">
        <img
          src={msg.fileUrl}
          alt="attachment"
          className="mb-2 max-h-56 w-full max-w-[220px] rounded-2xl object-cover shadow-sm transition hover:opacity-90"
        />
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
        className={`mb-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
          isMine
            ? 'border-sky-300/40 bg-white/10 text-sky-50 hover:bg-white/20'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
      >
        <FileText size={14} />
        <span className="max-w-[160px] truncate">{fileName.replace(/^\d+-/, '')}</span>
      </a>
    );
  }

  return <p className="text-sm leading-relaxed">{msg.message}</p>;
};

const AdminChatWindow = ({ student, adminId }) => {
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const scrollRef = useRef();
  const joinedRoomRef = useRef(null);
  const fileInputRef = useRef();

  const roomId = student?.room_id || `chat_${student?.id}`;
  const studentName = `${student?.surname || ''} ${student?.other_names || ''}`.trim() || student?.email || 'Contact';

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/chat/session/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessionActive(Boolean(res.data?.data?.active));
    } catch (err) {
      console.error('Error loading chat session', err);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/api/chat/history/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatHistory(res.data);
      } catch (err) {
        console.error('Error loading chat history', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (roomId) {
      fetchHistory();
      fetchSession();
      const poll = setInterval(() => {
        fetchHistory();
        fetchSession();
      }, 4000);

      const joinRoom = () => {
        if (!socket) return;
        if (joinedRoomRef.current !== roomId) {
          joinedRoomRef.current = roomId;
          socket.emit('join_room', { roomId });
        }
      };
      joinRoom();
      socket?.on('connect', joinRoom);

      const handleReceiveMessage = (data) => {
        if (data.room === roomId) setChatHistory((prev) => [...prev, data]);
      };

      const handleDelivered = ({ roomId: deliveredRoom, messageIds }) => {
        if (deliveredRoom === roomId) {
          setChatHistory((prev) => prev.map((msg) =>
            messageIds.includes(msg.id) ? { ...msg, status: 'delivered' } : msg
          ));
        }
      };

      const handleSessionStarted = ({ roomId: startedRoom }) => {
        if (startedRoom === roomId) setSessionActive(true);
      };

      const handleSessionEnded = ({ roomId: endedRoom }) => {
        if (endedRoom === roomId) setSessionActive(false);
      };

      socket?.on('receive_message', handleReceiveMessage);
      socket?.on('messages_delivered', handleDelivered);
      socket?.on('chat_session_started', handleSessionStarted);
      socket?.on('chat_session_ended', handleSessionEnded);

      return () => {
        clearInterval(poll);
        socket?.off('connect', joinRoom);
        socket?.off('receive_message', handleReceiveMessage);
        socket?.off('messages_delivered', handleDelivered);
        socket?.off('chat_session_started', handleSessionStarted);
        socket?.off('chat_session_ended', handleSessionEnded);
        joinedRoomRef.current = null;
      };
    }

    return undefined;
  }, [socket, roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview({
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      localUrl: URL.createObjectURL(file),
      fileUrl: null,
      fileType: null
    });

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/chat/upload', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreview((prev) => ({ ...prev, fileUrl: res.data.fileUrl, fileType: res.data.fileType }));
    } catch (err) {
      console.error('Upload error', err);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const sendFile = () => {
    if (!preview?.fileUrl || !socket) return;

    socket.emit('send_message', { roomId, message: '', fileUrl: preview.fileUrl, fileType: preview.fileType });

    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = () => {
    if (message.trim() === '' || !socket) return;

    socket.emit('send_message', { roomId, message });

    setMessage('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(248,252,255,0.98),rgba(239,248,253,0.85))]">
      <div className="border-b border-sky-100/90 bg-white/80 px-5 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
              sessionActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {sessionActive ? 'Session Active' : 'Awaiting Session'}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
              student?.conversation_type === 'guest'
                ? 'bg-slate-200 text-slate-700'
                : student?.is_approved_student
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-sky-100 text-sky-700'
            }`}
          >
            {student?.conversation_type === 'guest'
              ? (student?.is_registered_student ? 'Guest (Registered)' : 'Guest (Not Registered)')
              : (student?.is_approved_student ? 'Registered / Approved Student' : 'Registered Student')}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {loadingHistory ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-slate-400">
            <Loader2 className="mb-2 animate-spin" size={24} />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Loading history</p>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-sky-100 bg-white/80 px-6 text-center">
            <div className="mb-4 rounded-full bg-sky-50 p-4 text-sky-500">
              <MessageSquareMore size={28} />
            </div>
            <p className="text-base font-bold text-slate-700">No previous conversation</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">Messages between admin and student will appear here once support chat starts.</p>
          </div>
        ) : (
          chatHistory.map((msg, i) => {
            const isMine = msg.senderId === adminId;
            return (
              <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] rounded-2xl border px-4 py-3 shadow-sm ${
                    isMine
                      ? 'rounded-tr-md border-sky-400/30 bg-[#2095D3] text-white'
                      : 'rounded-tl-md border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <MessageContent msg={msg} isMine={isMine} />
                  <div className={`mt-2 flex items-center gap-1 text-[10px] font-semibold ${isMine ? 'justify-end text-sky-100' : 'justify-start text-slate-400'}`}>
                    <span>{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <MessageStatus status={msg.status} isMine={isMine} />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {preview && (
        <div className="border-t border-sky-100 bg-white px-5 py-3">
          <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-slate-50 px-3 py-2">
            {preview.type === 'image' ? (
              <img src={preview.localUrl} className="h-11 w-11 rounded-xl object-cover" alt="preview" />
            ) : (
              <div className="rounded-lg bg-slate-200 p-2 text-slate-600">
                <FileText size={16} />
              </div>
            )}
            <span className="flex-1 truncate text-xs font-medium text-slate-600">{preview.name}</span>
            {uploading ? (
              <Loader2 size={16} className="animate-spin text-[#2095D3]" />
            ) : (
              <button
                type="button"
                onClick={sendFile}
                className="inline-flex items-center gap-1 rounded-xl bg-[#2095D3] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#1785be]"
              >
                <Send size={12} /> Send
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              aria-label="Remove attachment preview"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-sky-100/90 bg-white px-5 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-sky-100 bg-slate-50 px-2 py-2 transition focus-within:border-[#2095D3] focus-within:ring-2 focus-within:ring-sky-100">
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-[#2095D3]"
            disabled={uploading}
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder={`Reply to ${student?.surname || 'student'}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!message.trim()}
            className="rounded-xl bg-[#2095D3] p-2.5 text-white transition hover:bg-[#1785be] disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChatWindow;

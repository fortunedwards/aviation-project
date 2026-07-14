import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { 
  BookOpen,
  AlertCircle, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget';
import { usePopup } from '../components/context/PopupProvider';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';
import CalendarPage from './CalendarPage';

const getUserDisplayName = (user) =>
  user?.name ||
  user?.full_name ||
  [user?.surname, user?.other_names].filter(Boolean).join(' ').trim() ||
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
  'Student';

const StudentPortal = ({ setUser }) => {
  const popup = usePopup();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/api/students/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data.data);
      } catch (err) {
        console.error("Portal load error", err);
        if (err.response?.status === 401) handleLogout();
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');

    try {
      if (token) {
        await api.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout audit failed', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  const handlePayment = async () => {
    if (!profile?.course_fee || profile.course_fee <= 0) {
      return popup.warning('Tuition fee has not been assigned yet. Please contact the Accountable Manager.', {
        title: 'Fee Not Available',
      });
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/payments/initialize', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      console.error("Payment Error:", err);
      popup.error('Payment initialization failed. Please try again later.', {
        title: 'Unable To Start Payment',
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-white text-xs uppercase tracking-[0.3em]">Syncing Dossier...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F4FAFF]">
      <SideNavBar
        role="Student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <TopNavBar
        role="Student"
        userName={getUserDisplayName(profile)}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-6 pb-6 pt-24 md:px-12 md:pb-12 md:pt-28">
        {activeTab === 'calendar' ? (
          <CalendarPage
            title="Student Calendar"
            subtitle="Stay on top of classes, simulator slots, and key academic dates."
          />
        ) : (
        <>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-1">Authenticated Portal</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {profile?.surname}</h2>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-200">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600">
                {profile?.surname?.[0]}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                <p className="text-xs font-bold text-green-600">Account Active</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* PRIMARY ENROLLMENT CARD */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    profile?.admission_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                 }`}>
                   {profile?.admission_status}
                 </span>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="bg-blue-50 p-6 rounded-3xl text-blue-600 border border-blue-100">
                  <BookOpen size={48} />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-slate-900 leading-tight mb-2">{profile?.course_name}</h4>
                  <p className="text-slate-500 font-medium max-w-md leading-relaxed">
                    Your admission has been processed. Please complete your financial clearance to secure your slot in the upcoming batch.
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Tuition</p>
                  <p className="text-2xl font-black text-slate-900">
                    {profile?.course_fee ? `₦${Number(profile.course_fee).toLocaleString()}` : 'PENDING'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commencement</p>
                  <p className="text-2xl font-black text-slate-900 uppercase">Q2 2026</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference ID</p>
                  <p className="text-2xl font-black text-slate-900 uppercase">{profile?.payment_ref?.slice(0,8) || '---'}</p>
                </div>
              </div>
            </div>

            {/* REMARKS & NOTIFICATIONS */}
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="bg-white/20 p-4 rounded-2xl">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Admission Officer Remarks</p>
                        <p className="text-lg font-bold italic">"{profile?.instructor_remarks || 'Your application is under standard review.'}"</p>
                    </div>
                </div>
            </div>
          </div>

          {/* FINANCE SIDEBAR */}
          <div className="space-y-8">
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
              
              <div className="flex items-center gap-3 mb-8">
                <Wallet className="text-blue-400" size={24} />
                <h3 className="font-black uppercase tracking-widest text-xs text-blue-400">Financial Status</h3>
              </div>

              <div className="mb-10">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Outstanding Balance</p>
                <p className="text-5xl font-black tracking-tighter">
                    ₦{profile?.course_fee ? Number(profile.course_fee).toLocaleString() : '0'}
                </p>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-slate-400">Payment Status</span>
                    <span className="text-xs font-black uppercase text-amber-400">Unpaid</span>
                </div>
              </div>

              <button 
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Clear Tuition Fee
              </button>

              <p className="text-center mt-6 text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-4">
                Payments are processed securely via Paystack. Your receipt will be generated instantly.
              </p>
            </div>

            {/* QUICK LINKS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Help & Support</h4>
                <div className="space-y-4">
                    <button className="w-full text-left text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-between">
                        Contact Admissions Office <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                    </button>
                    <button className="w-full text-left text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-between">
                        Request Fee Deferment <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                    </button>
                </div>
            </div>
          </div>
        </div>
        </>
        )}
        </main>
        <ChatWidget user={{ ...profile, id: profile.student_user_id }} />
    </div>
  );
};

export default StudentPortal;

import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { AlertCircle, RefreshCw } from 'lucide-react';
import AdmissionsWorkspace from '../components/AdmissionsWorkspace';
import ReviewModal from '../components/ReviewModal';
import { useNavigate } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';
import CalendarPage from './CalendarPage';

const getUserDisplayName = (user) =>
  user?.name ||
  user?.full_name ||
  [user?.surname, user?.other_names].filter(Boolean).join(' ').trim() ||
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
  'Instructor';

const InstructorDashboard = ({ logout }) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const instructorUser = userString ? JSON.parse(userString) : null;
  const instructorName = getUserDisplayName(instructorUser);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/applications/instructor-queue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError(`Failed to load queue: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium tracking-wide">Accessing Aeroconsult Records...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideNavBar role="Instructor" activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
      <TopNavBar role="Instructor" userName={instructorName} />

      <div className="min-w-0 flex-1 px-6 pb-6 pt-24 md:px-8 md:pb-8 md:pt-28">
        <div className="w-full">
          {activeTab === 'queue' && (
            <>
              <div className="mb-8 flex justify-end gap-3">
                <button onClick={fetchQueue} disabled={loading} className="app-button-secondary !rounded-full">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {error && (
                <div className="mb-6 flex items-center rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  <AlertCircle className="mr-2" size={20} /> {error}
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 gap-4">
            {activeTab === 'calendar' && (
              <CalendarPage
                title="Instructor Calendar"
                subtitle="Coordinate simulator sessions, review windows, and training milestones."
              />
            )}
            {activeTab === 'queue' && (
              <AdmissionsWorkspace
                applications={applications}
                title="Review Queue"
                subtitle="Review the instructor queue and open each application file for detailed decisions."
                showCourseFilter
                onReview={setSelectedApp}
                reviewLabel="Review File"
              />
            )}
          </div>
        </div>
      </div>

      {selectedApp && (
        <ReviewModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          refresh={fetchQueue}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;

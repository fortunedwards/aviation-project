import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './components/SocketContext';
import { PopupProvider } from './components/context/PopupProvider';

// Page Imports
import Register from './pages/Register';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import PaymentSuccess from './pages/PaymentSuccess';
import StatusTracker from './pages/StatusTracker';
import RegistrationSuccess from './pages/RegistrationSuccess';
import HomePage from './pages/HomePage';
import PublicPlaceholderPage from './pages/PublicPlaceholderPage';
import AboutPage from './pages/AboutPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import ScrollToTop from './components/ScrollToTop';
import api from './lib/api';

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

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
    }
  };

  const normalizedRole = user?.role?.toLowerCase?.() || '';

  return (
    <PopupProvider>
      {/* Passing 'user' here allows the Provider to react to login/logout state changes */}
      <SocketProvider user={user}>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* HOME PAGE */}
            <Route path="/" element={<HomePage />} />

            {/* PUBLIC ROUTES */}
            <Route path="/register" element={<Register />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/status-tracker" element={<StatusTracker />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/training-calendar"
              element={
                <PublicPlaceholderPage
                  title="Training Calendar"
                  description="This page will showcase upcoming programs, training dates, and enrollment pathways."
                />
              }
            />
            <Route
              path="/courses"
              element={<CoursesPage />}
            />
            <Route path="/courses/:slug" element={<CourseDetailsPage />} />
            <Route
              path="/gallery"
              element={
                <PublicPlaceholderPage
                  title="Gallery"
                  description="This page will display event media, training highlights, and visual stories from our aviation community."
                />
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <PublicPlaceholderPage
                  title="Privacy Policy"
                  description="This page will contain Aeroconsult privacy terms and how participant data is handled."
                />
              }
            />
            <Route
              path="/terms-of-service"
              element={
                <PublicPlaceholderPage
                  title="Terms of Service"
                  description="This page will outline Aeroconsult service terms, eligibility, responsibilities, and policy conditions."
                />
              }
            />
            <Route
              path="/contact-support"
              element={
                <PublicPlaceholderPage
                  title="Contact Support"
                  description="This page will provide support contacts and direct communication channels for Aeroconsult inquiries."
                />
              }
            />
            <Route path="/login" element={<Login setUser={setUser} />} />

            {/* STUDENT PORTAL ROUTE */}
            <Route 
              path="/student-portal" 
              element={
                !user || normalizedRole !== 'student' 
                  ? <Navigate to="/login" /> 
                  : <StudentPortal setUser={setUser} />
              } 
            />

            {/* STAFF DASHBOARD ROUTE */}
            <Route 
              path="/dashboard" 
              element={
                !user ? <Navigate to="/login" /> : (
                  normalizedRole === 'student' ? <Navigate to="/student-portal" /> :
                  normalizedRole === 'manager' ? <ManagerDashboard logout={handleLogout} /> :
                  normalizedRole === 'instructor' ? <InstructorDashboard logout={handleLogout} /> :
                  normalizedRole === 'admin' ? <AdminDashboard logout={handleLogout} /> :
                  
                  <div className="p-10 text-center">Role not recognized. Please contact support.</div>
                )
              } 
            />
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </Router>
      </SocketProvider>
    </PopupProvider>
  );
}

export default App;

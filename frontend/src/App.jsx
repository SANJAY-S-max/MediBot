import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import ChatbotPage from './pages/ChatbotPage';
import ReportsPage from './pages/ReportsPage';
import TelemedicinePage from './pages/TelemedicinePage';
import MedicationReminders from './pages/MedicationReminders';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Global Navigation Header */}
            <Navbar />
            
            {/* Main Page Workspace */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Patient Routes (Protected) */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <ChatbotPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/telemedicine" 
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <TelemedicinePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reminders" 
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <MedicationReminders />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Doctor Routes (Protected) */}
                <Route 
                  path="/doctor" 
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes (Protected) */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Common Settings (Protected for all roles) */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            {/* Global Medical Disclaimer Footer */}
            <Footer />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

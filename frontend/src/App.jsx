import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IdeaPage from './pages/IdeaPage';
import ChatPage from './pages/ChatPage';
import PitchPage from './pages/PitchPage';
import SimulatePage from './pages/SimulatePage';
import CollaboratePage from './pages/CollaboratePage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/idea" element={<PrivateRoute><IdeaPage /></PrivateRoute>} />
          <Route path="/chat/:ideaId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/pitch/:ideaId" element={<PrivateRoute><PitchPage /></PrivateRoute>} />
          <Route path="/simulate/:ideaId" element={<PrivateRoute><SimulatePage /></PrivateRoute>} />
          <Route path="/collaborate" element={<PrivateRoute><CollaboratePage /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { stackAuth } from './services/stack-auth';
import { db } from './services/db';

// Pages
import LoginPage from './pages/Login';
import BoardsPage from './pages/Boards';
import PagesListPage from './pages/PagesList';
import PageDetailPage from './pages/PageDetail';
import PublicSharePage from './pages/PublicShare';
import SettingsMembersPage from './pages/SettingsMembers';
import Layout from './components/Layout';

// Fix: Use React.FC with React.PropsWithChildren to ensure 'children' is correctly recognized by TypeScript
const ProtectedRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const user = stackAuth.useUser();
  const currentSpace = stackAuth.useCurrentSpace();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Ensure we have some default data for this tenant
  useEffect(() => {
    if (currentSpace) {
      db.bootstrapSpace(currentSpace.id, user.id);
    }
  }, [currentSpace, user.id]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/share/page/:token" element={<PublicSharePage />} />
        
        {/* Protected Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="boards" replace />} />
          <Route path="boards" element={<BoardsPage />} />
          <Route path="boards/:boardId" element={<BoardsPage />} />
          <Route path="pages" element={<PagesListPage />} />
          <Route path="pages/:pageId" element={<PageDetailPage />} />
          <Route path="settings/members" element={<SettingsMembersPage />} />
        </Route>

        {/* Redirect root based on auth */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const RootRedirect = () => {
  const user = stackAuth.useUser();
  return user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />;
};

export default App;

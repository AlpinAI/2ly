/**
 * App Component
 *
 * WHY: Root component that sets up the provider hierarchy.
 *
 * PROVIDER ORDER MATTERS:
 * 1. ThemeProvider - Theme must be available first (affects all UI)
 * 2. ApolloProvider - GraphQL client (server state)
 * 3. BrowserRouter - Routing (required for navigate())
 * 4. SystemInitChecker - Check system initialization before anything else
 * 5. AuthProvider - Authentication state (uses navigate(), so must be inside Router)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ApolloProvider } from '@/lib/apollo/ApolloProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SystemInitChecker } from '@/components/logic/SystemInitChecker';
import { ProtectedRoute } from '@/components/logic/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import AgentsPage from '@/pages/AgentsPage';
import ToolsPage from '@/pages/ToolsPage';
import SettingsPage from '@/pages/SettingsPage';
import InitPage from '@/pages/InitPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <ApolloProvider>
        <BrowserRouter>
          <SystemInitChecker>
            <AuthProvider>
              <Routes>
                {/* Root redirects to app (will be caught by ProtectedRoute if not authenticated) */}
                <Route path="/" element={<Navigate to="/app/overview" replace />} />

                {/* Legacy redirect for /dashboard */}
                <Route path="/dashboard" element={<Navigate to="/app/overview" replace />} />

                {/* System initialization (no auth required, but SystemInitChecker allows /init) */}
                <Route path="/init" element={<InitPage />} />

                {/* Public routes (only accessible if system is initialized) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected app routes with layout (require system init + auth) */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Nested routes - AppLayout provides header + navigation */}
                  <Route path="overview" element={<DashboardPage />} />
                  <Route path="agents" element={<AgentsPage />} />
                  <Route path="tools" element={<ToolsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Redirect /app to /app/overview */}
                  <Route index element={<Navigate to="/app/overview" replace />} />
                </Route>

                {/* 404 page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AuthProvider>
          </SystemInitChecker>
        </BrowserRouter>
      </ApolloProvider>
    </ThemeProvider>
  );
}

export default App;

/**
 * App Component
 *
 * WHY: Root component that sets up the provider hierarchy.
 *
 * PROVIDER ORDER MATTERS:
 * 1. ThemeProvider - Theme must be available first (affects all UI)
 * 2. NotificationProvider - Transient UI (confirms, toasts) - needs theme, no other deps
 * 3. ApolloProvider - GraphQL client (server state)
 * 4. BrowserRouter - Routing (required for navigate())
 * 5. SystemInitChecker - Check system initialization before anything else
 * 6. AuthProvider - Authentication state (uses navigate(), so must be inside Router)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ApolloProvider } from '@/lib/apollo/ApolloProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SystemInitChecker } from '@/components/logic/system-init-checker';
import { ProtectedRoute } from '@/components/logic/protected-route';
import { WorkspaceLoader } from '@/components/logic/workspace-loader';
import { WorkspaceRedirect } from '@/components/logic/workspace-redirect';
import { AppLayout } from '@/components/layout/app-layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import SkillsPage from '@/pages/SkillsPage';
import ToolsPage from '@/pages/ToolsPage';
import SourcesPage from '@/pages/SourcesPage';
import SettingsPage from '@/pages/SettingsPage';
import MonitoringPage from '@/pages/MonitoringPage';
import MyIntegrationsPage from '@/pages/MyIntegrationsPage';
import InitPage from '@/pages/InitPage';
import BackendErrorPage from '@/pages/BackendErrorPage';
import OAuthErrorPage from '@/pages/OAuthErrorPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ApolloProvider>
          <BrowserRouter>
            <SystemInitChecker>
              <AuthProvider>
                <Routes>
                {/* Root redirects to default workspace */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <WorkspaceRedirect />
                    </ProtectedRoute>
                  }
                />

                {/* Legacy redirects */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/app/*" element={<Navigate to="/" replace />} />

                {/* System initialization (no auth required, but SystemInitChecker allows /init) */}
                <Route path="/init" element={<InitPage />} />

                {/* Backend error page (no auth required, SystemInitChecker handles this) */}
                <Route path="/backend-error" element={<BackendErrorPage />} />

                {/* OAuth error page (no auth required, shown when OAuth callback fails) */}
                <Route path="/oauth/error" element={<OAuthErrorPage />} />

                {/* Public routes (only accessible if system is initialized) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected workspace routes with layout (require system init + auth) */}
                <Route
                  path="/w/:workspaceId"
                  element={
                    <ProtectedRoute>
                      <WorkspaceLoader>
                        <AppLayout />
                      </WorkspaceLoader>
                    </ProtectedRoute>
                  }
                >
                  {/* Nested routes - AppLayout provides header + navigation */}
                  <Route path="overview" element={<DashboardPage />} />
                  <Route path="skills" element={<SkillsPage />} />
                  <Route path="tools" element={<ToolsPage />} />
                  <Route path="sources" element={<SourcesPage />} />
                  <Route path="monitoring" element={<MonitoringPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="my-integrations" element={<MyIntegrationsPage />} />

                  {/* Redirect /w/:workspaceId to /w/:workspaceId/overview */}
                  <Route index element={<Navigate to="overview" replace />} />
                </Route>

                {/* 404 page */}
                <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AuthProvider>
            </SystemInitChecker>
          </BrowserRouter>
        </ApolloProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;

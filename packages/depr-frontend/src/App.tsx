import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { useAuthentication } from './hooks/useAuthentication';
// Context Providers
import { AuthenticationProvider } from './contexts/AuthenticationProvider';
import { getAuthService } from './services/auth.service';
import { getSystemInitializationService } from './services/system.service';
import { WorkspaceProvider } from './contexts/WorkspaceContextProvider';
// Route Protection
import { ProtectedRoute, PublicRoute, SystemInitRoute, AuthRouteManager } from './components/routing';
// Layout
import Layout from './components/layout/Layout';
// Pages
import LandingPage from './pages/LandingPage';
import { LoginPage, RegisterPage } from './pages/auth';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/AgentsPage';
import RecipesPage from './pages/RecipesPage';
import MonitoringPage from './pages/MonitoringPage';
import IntegrationPage from './pages/IntegrationPage';
import MCPServersPage from './pages/MCPServersPage';
import RuntimesPage from './pages/RuntimesPage';
import WelcomePage from './pages/WelcomePage';
import SettingsPage from './pages/SettingsPage';
import AgentWorkflowPage from './pages/AgentWorkflowPage';
import AgentCapabilitiesPage from './pages/AgentCapabilitiesPage';
import MCPServerWorkflowPage from './pages/MCPServerWorkflowPage';
import PlaygroundPage from './pages/PlaygroundPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  // Get the unified authenticated Apollo Client from the provider
  const apolloClient = useApolloClient();
  const authService = getAuthService(apolloClient);
  // Initialize system service early so it's available throughout the app
  getSystemInitializationService(apolloClient, authService);

  return (
    <AuthenticationProvider authService={authService}>
      <WorkspaceProvider>
        <Router>
          <AuthRouteManager>
            <AppContent />
          </AuthRouteManager>
        </Router>
      </WorkspaceProvider>
    </AuthenticationProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuthentication();

  const handleWelcomeComplete = () => {
    window.location.reload();
  };

  return (
    <Routes>
      {/* Public routes - no authentication required */}
      <Route
        path="/landing"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      {/* Authentication routes - redirect authenticated users */}
      <Route
        path="/login"
        element={
          <PublicRoute redirectAuthenticated>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute redirectAuthenticated>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* System initialization route */}
      <Route
        path="/welcome"
        element={
          <SystemInitRoute>
            <WelcomePage onComplete={handleWelcomeComplete} />
          </SystemInitRoute>
        }
      />

      {/* Protected workflow routes - require authentication but no layout */}
      <Route
        path="/agents/new"
        element={
          <ProtectedRoute requireWorkspace>
            <AgentWorkflowPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents/:runtimeId/capabilities"
        element={
          <ProtectedRoute requireWorkspace>
            <AgentCapabilitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mcp-servers/new"
        element={
          <ProtectedRoute requireWorkspace>
            <MCPServerWorkflowPage />
          </ProtectedRoute>
        }
      />

      {/* Main protected routes with layout */}
      <Route
        element={
          <ProtectedRoute requireWorkspace>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/mcp-servers" replace />} />
        <Route path="/mcp-servers" element={<MCPServersPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/runtimes" element={<RuntimesPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/integration" element={<IntegrationPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-all route - redirect based on authentication status */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/landing" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;

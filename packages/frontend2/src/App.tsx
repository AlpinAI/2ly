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
import { SystemInitChecker } from '@/components/SystemInitChecker';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
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
                {/* Root redirects to dashboard (will be caught by ProtectedRoute if not authenticated) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* System initialization (no auth required, but SystemInitChecker allows /init) */}
                <Route path="/init" element={<InitPage />} />

                {/* Public routes (only accessible if system is initialized) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes (require system init + auth) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

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

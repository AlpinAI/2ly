/**
 * App Component
 *
 * WHY: Root component that sets up the provider hierarchy.
 *
 * PROVIDER ORDER MATTERS:
 * 1. ThemeProvider - Theme must be available first (affects all UI)
 * 2. ApolloProvider - GraphQL client (server state)
 * 3. BrowserRouter - Routing (required for navigate())
 * 4. AuthProvider - Authentication state (uses navigate(), so must be inside Router)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ApolloProvider } from '@/lib/apollo/ApolloProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';

function App() {
  return (
    <ThemeProvider>
      <ApolloProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ApolloProvider>
    </ThemeProvider>
  );
}

export default App;

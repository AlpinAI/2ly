/**
 * SystemInitChecker Component
 *
 * WHY: Checks if system is initialized before allowing any navigation.
 * System initialization must happen before users can log in or register.
 *
 * FLOW:
 * 1. Check system initialization status
 * 2. If not initialized -> redirect to /init
 * 3. If initialized -> render children (which includes auth checks)
 */

import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSystemInit } from '@/hooks/useSystemInit';
import BackendErrorPage from '@/pages/BackendErrorPage';

interface SystemInitCheckerProps {
  children: ReactNode;
}

export function SystemInitChecker({ children }: SystemInitCheckerProps) {
  const { isInitialized, isLoading, isBackendError } = useSystemInit();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if we're already on the init page or backend error page
    if (location.pathname === '/init' || location.pathname === '/backend-error') {
      return;
    }

    // Once we know the initialization status
    if (!isLoading && isInitialized === false) {
      navigate('/init', { replace: true });
    }
  }, [isInitialized, isLoading, navigate, location.pathname]);

  // Show backend error page if backend is unreachable
  if (!isLoading && isBackendError) {
    return <BackendErrorPage />;
  }

  // Show loading state while checking system initialization
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Checking system status...
          </p>
        </div>
      </div>
    );
  }

  // If system is not initialized and we're not on /init, show loading
  // (the useEffect will redirect us)
  if (isInitialized === false && location.pathname !== '/init') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // System is initialized, render children
  return <>{children}</>;
}

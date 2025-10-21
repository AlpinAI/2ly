/**
 * ProtectedRoute Component Tests
 *
 * Tests for the ProtectedRoute component including authentication checks,
 * loading states, workspace requirements, and redirect behavior.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { ProtectedRoute, ProtectedRouteProps } from '../ProtectedRoute';
import { useAuthentication } from '../../../contexts/useAuthentication';
import { useWorkspace } from '../../../contexts/useWorkspace';
import { useRoutePreservation } from '../../../hooks/useRoutePreservation';

// Mock the dependencies
vi.mock('../../../contexts/useAuthentication');
vi.mock('../../../contexts/useWorkspace');
vi.mock('../../../hooks/useRoutePreservation');
vi.mock('../../auth/AuthLoadingSpinner', () => ({
  AuthLoadingSpinner: ({ message }: { message?: string }) => (
    <div data-testid="loading-spinner">{message || 'Loading...'}</div>
  )
}));

const mockUseAuthentication = useAuthentication as Mock;
const mockUseWorkspace = useWorkspace as Mock;
const mockUseRoutePreservation = useRoutePreservation as Mock;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
      <div data-testid="navigate" data-to={to} data-replace={replace}>
        Navigate to {to}
      </div>
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/test' })
  };
});

const defaultAuthState = {
  isAuthenticated: false,
  loading: false,
  authState: 'UNAUTHENTICATED',
  user: null,
  error: null
};

const defaultWorkspaceState = {
  workspaces: [],
  loading: false,
  error: null
};

const defaultRoutePreservation = {
  preserveCurrentRoute: vi.fn(),
  getPreservedRoute: vi.fn(() => null),
  clearPreservedRoute: vi.fn(),
  redirectToPreservedRoute: vi.fn(),
  hasPreservedRoute: vi.fn(() => false)
};

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

function renderProtectedRoute(props: Partial<ProtectedRouteProps> = {}) {
  return render(
    <MemoryRouter>
      <ProtectedRoute {...props}>
        <TestComponent />
      </ProtectedRoute>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthentication.mockReturnValue(defaultAuthState);
    mockUseWorkspace.mockReturnValue(defaultWorkspaceState);
    mockUseRoutePreservation.mockReturnValue(defaultRoutePreservation);
  });

  describe('Loading States', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        loading: true
      });

      renderProtectedRoute();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows loading spinner when token is refreshing', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        authState: 'TOKEN_REFRESHING'
      });

      renderProtectedRoute();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows custom fallback component when provided', () => {
      const FallbackComponent = () => <div data-testid="custom-fallback">Custom Loading</div>;

      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        loading: true
      });

      renderProtectedRoute({ fallback: FallbackComponent });

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Checks', () => {
    it('redirects to login when not authenticated', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: false
      });

      const preserveCurrentRoute = vi.fn();
      mockUseRoutePreservation.mockReturnValue({
        ...defaultRoutePreservation,
        preserveCurrentRoute
      });

      renderProtectedRoute();

      expect(preserveCurrentRoute).toHaveBeenCalled();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to custom login path when specified', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: false
      });

      renderProtectedRoute({ redirectTo: '/custom-login' });

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/custom-login');
    });

    it('renders protected content when authenticated', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true
      });

      mockUseWorkspace.mockReturnValue({
        ...defaultWorkspaceState,
        workspaces: [{ id: '1', name: 'Test Workspace' }]
      });

      renderProtectedRoute();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('Workspace Requirements', () => {
    it('shows workspace loading when workspace is required and loading', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true
      });

      mockUseWorkspace.mockReturnValue({
        ...defaultWorkspaceState,
        loading: true
      });

      renderProtectedRoute({ requireWorkspace: true });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading workspace...')).toBeInTheDocument();
    });

    it('shows workspace error when workspace fails to load', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true
      });

      mockUseWorkspace.mockReturnValue({
        ...defaultWorkspaceState,
        error: 'Failed to load workspace'
      });

      renderProtectedRoute({ requireWorkspace: true });

      expect(screen.getByText('Workspace Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load workspace')).toBeInTheDocument();
    });

    it('redirects to welcome when workspace is required but not available', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true
      });

      mockUseWorkspace.mockReturnValue({
        ...defaultWorkspaceState,
        workspaces: []
      });

      renderProtectedRoute({ requireWorkspace: true });

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/welcome');
    });

    it('allows access when workspace is not required', () => {
      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true
      });

      mockUseWorkspace.mockReturnValue({
        ...defaultWorkspaceState,
        workspaces: []
      });

      renderProtectedRoute({ requireWorkspace: false });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('Route Preservation', () => {
    it('calls preserveCurrentRoute when redirecting unauthenticated user', () => {
      const preserveCurrentRoute = vi.fn();
      mockUseRoutePreservation.mockReturnValue({
        ...defaultRoutePreservation,
        preserveCurrentRoute
      });

      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: false
      });

      renderProtectedRoute();

      expect(preserveCurrentRoute).toHaveBeenCalled();
    });

    it('does not call preserveCurrentRoute when authenticated', () => {
      const preserveCurrentRoute = vi.fn();
      mockUseRoutePreservation.mockReturnValue({
        ...defaultRoutePreservation,
        preserveCurrentRoute
      });

      mockUseAuthentication.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true
      });

      mockUseWorkspace.mockReturnValue({
        ...defaultWorkspaceState,
        workspaces: [{ id: '1', name: 'Test' }]
      });

      renderProtectedRoute();

      expect(preserveCurrentRoute).not.toHaveBeenCalled();
    });
  });
});
/**
 * AuthPage Example
 *
 * Demonstrates how to use the authentication components together to create
 * complete login and registration pages. This serves as both documentation
 * and a working example of the authentication UI components.
 */

import React, { useState } from 'react';
import { Shield, Users, Server } from 'lucide-react';
import {
  AuthFormCard,
  AuthFormCardHeader,
  AuthFormCardContent,
  AuthFormCardFooter,
  LoginForm,
  RegisterForm,
  AuthErrorBoundary,
  AuthLoadingOverlay,
} from './index';

type AuthMode = 'login' | 'register' | 'system-init';

/**
 * Example Authentication Page Layout
 */
const AuthPageExample: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = () => {
    console.log('Login successful!');
    // Navigate to dashboard or intended route
  };

  const handleRegistrationSuccess = () => {
    console.log('Registration successful!');
    // Navigate to dashboard or intended route
  };

  // System initialization handler - currently used in system-init case
  // const handleSystemInitSuccess = () => {
  //   console.log('System initialization successful!');
  //   // Navigate to dashboard
  // };

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <AuthFormCard maxWidth="sm">
            <AuthFormCardHeader
              title="Welcome back"
              subtitle="Sign in to your account to continue"
              icon={<Shield className="w-6 h-6" />}
            />

            <AuthFormCardContent>
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                showCreateAccount={true}
              />
            </AuthFormCardContent>

            <AuthFormCardFooter>
              <button
                onClick={() => setMode('register')}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Create a new account instead
              </button>
            </AuthFormCardFooter>
          </AuthFormCard>
        );

      case 'register':
        return (
          <AuthFormCard maxWidth="md">
            <AuthFormCardHeader
              title="Create your account"
              subtitle="Join us today and start managing your AI tools"
              icon={<Users className="w-6 h-6" />}
            />

            <AuthFormCardContent>
              <RegisterForm
                onRegistrationSuccess={handleRegistrationSuccess}
                showLogin={true}
                requireTermsAcceptance={true}
              />
            </AuthFormCardContent>

            <AuthFormCardFooter>
              <button
                onClick={() => setMode('login')}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Already have an account? Sign in
              </button>
            </AuthFormCardFooter>
          </AuthFormCard>
        );

      case 'system-init':
        return (
          <AuthFormCard maxWidth="md">
            <AuthFormCardHeader
              title="Initialize System"
              subtitle="Set up your 2ly system with an admin account"
              icon={<Server className="w-6 h-6" />}
            />

            <AuthFormCardContent>
              {/* System initialization form would go here */}
              <div className="text-center py-8 text-gray-500">
                System initialization form component
                <br />
                <small>(Implementation pending)</small>
              </div>
            </AuthFormCardContent>

            <AuthFormCardFooter>
              <p className="text-gray-500">
                This will create the first admin user for your system
              </p>
            </AuthFormCardFooter>
          </AuthFormCard>
        );

      default:
        return null;
    }
  };

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          {/* Demo Mode Switcher */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              2ly Authentication Components
            </h1>
            <p className="text-gray-600 mb-6">
              Interactive demo of authentication UI components
            </p>

            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Login Form
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Registration Form
              </button>
              <button
                onClick={() => setMode('system-init')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'system-init'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                System Init
              </button>
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => setIsLoading(true)}
                className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
              >
                Test Loading Overlay
              </button>
            </div>
          </div>

          {/* Authentication Form */}
          {renderAuthForm()}

          {/* Loading Overlay Demo */}
          <AuthLoadingOverlay
            isVisible={isLoading}
            title="Processing..."
            description="This is a demo of the loading overlay component"
            canCancel={true}
            onCancel={() => setIsLoading(false)}
          />

          {/* Usage Examples */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Component Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Real-time form validation with user-friendly error messages</li>
                <li>✅ Password strength indicator with requirements checklist</li>
                <li>✅ Accessible form controls with WCAG 2.1 AA compliance</li>
                <li>✅ Responsive design that works on all screen sizes</li>
                <li>✅ Loading states and error boundaries for robust UX</li>
                <li>✅ Integration with authentication context from Task Group 1</li>
                <li>✅ Consistent styling matching the existing 2ly design system</li>
                <li>✅ TypeScript strict mode compliance with comprehensive interfaces</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
};

export default AuthPageExample;
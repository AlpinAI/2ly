/**
 * AuthLayout Component
 *
 * Layout component for authentication pages (login, register).
 * Provides consistent styling and structure for auth-related pages.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLandingLink?: boolean;
}

/**
 * Layout wrapper for authentication pages
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  showLandingLink = true
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with logo and navigation */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">2ly</span>
            </div>

            {/* Navigation */}
            {showLandingLink && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/landing"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              {children}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              By using 2ly, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          style={{
            animation: 'blob 7s infinite',
            animationDelay: '0s'
          }}
        ></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          style={{
            animation: 'blob 7s infinite',
            animationDelay: '2s'
          }}
        ></div>
        <div
          className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          style={{
            animation: 'blob 7s infinite',
            animationDelay: '4s'
          }}
        ></div>
      </div>

    </div>
  );
}

export default AuthLayout;
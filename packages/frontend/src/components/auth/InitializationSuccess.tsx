/**
 * InitializationSuccess Component
 *
 * Success screen shown after system initialization completion.
 * Displays summary of created resources, next steps guidance,
 * and provides options to continue to main application.
 */

import React from 'react';
import { CheckCircle, User, Settings, Rocket, BookOpen, ExternalLink } from 'lucide-react';
import { AuthFormCard, AuthFormCardHeader, AuthFormCardContent, AuthFormCardFooter } from './index';
import Button from '../ui/Button';
import { cn } from '../../utils/helpers';
import { InitializationResult } from '../../services/system.service';

export interface InitializationSuccessProps {
  initializationResult: InitializationResult;
  onContinue: () => void;
  onExploreFeatures?: () => void;
  className?: string;
}

const InitializationSuccess: React.FC<InitializationSuccessProps> = ({
  initializationResult,
  onContinue,
  onExploreFeatures,
  className,
}) => {
  const { system, user, workspace } = initializationResult;

  return (
    <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center p-4', className)}>
      <AuthFormCard maxWidth="md" className="w-full max-w-2xl">
        {/* Success Header */}
        <AuthFormCardHeader
          title="Setup Complete!"
          subtitle="Your 2ly platform has been successfully initialized and is ready to use."
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          className="mb-8"
        />

        <AuthFormCardContent>
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              What was created
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* System Information */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center mb-3">
                  <Settings className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-gray-900">System</h4>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {system.name}</p>
                  {system.description && (
                    <p><span className="font-medium">Description:</span> {system.description}</p>
                  )}
                  <p><span className="font-medium">Status:</span>
                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Initialized
                    </span>
                  </p>
                </div>
              </div>

              {/* Administrator Account */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-purple-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Administrator</h4>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {user.name && (
                    <p><span className="font-medium">Name:</span> {user.name}</p>
                  )}
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Role:</span>
                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Administrator
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Default Workspace (if available) */}
            {workspace && Object.keys(workspace).length > 0 && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center mb-3">
                  <Rocket className="w-5 h-5 text-orange-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Default Workspace</h4>
                </div>
                <div className="text-sm text-gray-600">
                  <p>A default workspace has been created and is ready for your AI tools and agents.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Start Checklist */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Rocket className="w-5 h-5 mr-2" />
              Next Steps
            </h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Explore the Dashboard</p>
                  <p className="text-sm text-blue-700">Get familiar with the main interface and available features.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Add Your First Agent</p>
                  <p className="text-sm text-blue-700">Connect an AI agent or tool to start automating tasks.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Configure Settings</p>
                  <p className="text-sm text-blue-700">Customize your workspace preferences and security settings.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Invite Team Members</p>
                  <p className="text-sm text-blue-700">Add other users and set up their roles and permissions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center"
              size="lg"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Continue to Dashboard
            </Button>

            {onExploreFeatures && (
              <Button
                variant="outline"
                onClick={onExploreFeatures}
                className="flex-1 flex items-center justify-center"
                size="lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Features
              </Button>
            )}
          </div>
        </AuthFormCardContent>

        <AuthFormCardFooter>
          {/* Additional Resources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={(e) => e.preventDefault()} // TODO: Add actual documentation link
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-gray-900">Documentation</h4>
                <p className="text-xs text-gray-600 truncate">Complete setup guide</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-2 text-gray-400 flex-shrink-0" />
            </a>

            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={(e) => e.preventDefault()} // TODO: Add actual support link
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-gray-900">Support</h4>
                <p className="text-xs text-gray-600 truncate">Get help if you need it</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-2 text-gray-400 flex-shrink-0" />
            </a>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Welcome to 2LY! Your AI tool management platform is ready to use.
            </p>
          </div>
        </AuthFormCardFooter>
      </AuthFormCard>
    </div>
  );
};

export default InitializationSuccess;
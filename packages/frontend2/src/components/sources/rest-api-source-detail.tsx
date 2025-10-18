/**
 * RESTAPISourceDetail Component
 *
 * WHY: Placeholder detail panel for REST API sources.
 * Will be fully implemented when REST API source support is added.
 *
 * DISPLAYS (placeholder):
 * - Name
 * - Base URL
 * - Authentication type
 * - Number of endpoints
 * - Sample endpoint list
 * - "Coming Soon" banner
 */

import { Globe, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RESTAPISource } from '@/types/sources';

export interface RESTAPISourceDetailProps {
  source: RESTAPISource;
}

export function RESTAPISourceDetail({ source }: RESTAPISourceDetailProps) {
  // Placeholder data
  const mockEndpoints = [
    { id: '1', method: 'GET', path: '/users' },
    { id: '2', method: 'POST', path: '/users' },
    { id: '3', method: 'GET', path: '/users/{id}' },
    { id: '4', method: 'PUT', path: '/users/{id}' },
    { id: '5', method: 'DELETE', path: '/users/{id}' },
    { id: '6', method: 'GET', path: '/posts' },
    { id: '7', method: 'POST', path: '/posts' },
    { id: '8', method: 'GET', path: '/posts/{id}' },
  ];

  const authTypeLabels = {
    API_KEY: 'API Key',
    OAUTH2: 'OAuth 2.0',
    BASIC: 'Basic Auth',
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Coming Soon Banner */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Coming Soon
            </h4>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              REST API sources are not yet implemented. This is a preview of how they will look.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {source.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{source.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Base URL */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Base URL
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
            {source.baseUrl}
          </p>
        </div>

        {/* Authentication Type */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Authentication
          </h4>
          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            {authTypeLabels[source.authType]}
          </span>
        </div>

        {/* Endpoints */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Endpoints ({source.endpointCount || mockEndpoints.length})
          </h4>
          <ul className="space-y-1">
            {mockEndpoints.map((endpoint) => (
              <li
                key={endpoint.id}
                className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 flex items-center gap-2"
              >
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium font-mono ${
                    endpoint.method === 'GET'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : endpoint.method === 'POST'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : endpoint.method === 'PUT'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {endpoint.method}
                </span>
                <span className="font-mono text-xs">{endpoint.path}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Delete Button (disabled) */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled
            title="Available when REST API sources are implemented"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Source
          </Button>
        </div>
      </div>
    </div>
  );
}

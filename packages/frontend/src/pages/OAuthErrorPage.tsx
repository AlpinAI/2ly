/**
 * OAuthErrorPage Component
 *
 * WHY: Displayed when an OAuth callback fails, providing error details
 * without requiring workspace context.
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'You denied access to the application.',
  invalid_request: 'The authorization request was invalid.',
  unauthorized_client: 'The application is not authorized to request access.',
  unsupported_response_type: 'The authorization server does not support the requested response type.',
  invalid_scope: 'The requested scope is invalid or unknown.',
  server_error: 'The authorization server encountered an error.',
  temporarily_unavailable: 'The authorization server is temporarily unavailable.',
  missing_params: 'The callback was missing required parameters.',
  connection_failed: 'Failed to establish the OAuth connection.',
};

export default function OAuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const error = searchParams.get('error') || 'unknown_error';
  const errorDescription = searchParams.get('error_description');

  const friendlyMessage = ERROR_MESSAGES[error] || 'An unexpected error occurred during authentication.';

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <KeyRound className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
            Authentication Failed
          </h3>
          <p className="text-sm text-muted-foreground text-gray-600 dark:text-gray-400">
            Unable to complete OAuth authentication
          </p>
        </div>

        <div className="p-6 pt-0 space-y-6">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">{friendlyMessage}</p>
                {errorDescription && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">{errorDescription}</p>
                )}
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button onClick={handleGoBack} className="w-full" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If this problem persists, please try again or contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

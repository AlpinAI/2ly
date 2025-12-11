/**
 * BackendErrorPage Component
 *
 * WHY: Displayed when the backend is unreachable, providing a clear error message
 * and automatic retry functionality.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackendErrorPage() {
  const [countdown, setCountdown] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-reload the page when countdown reaches 0
          window.location.reload();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
            Backend Unavailable
          </h3>
          <p className="text-sm text-muted-foreground text-gray-600 dark:text-gray-400">
            Unable to connect to the Skilder backend service
          </p>
        </div>
        
        <div className="p-6 pt-0 space-y-6">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">What this means:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>The backend server may be starting up</li>
                  <li>Network connectivity issues</li>
                  <li>Backend service is temporarily down</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Auto-retrying in {countdown} seconds</span>
            </div>

            <Button 
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="w-full"
              variant="outline"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Retry Now
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If this problem persists, please check your network connection
              or contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  WelcomeWorkflow,
} from '../components/add-agent-workflow';
import { useAuthentication } from '../contexts/useAuthentication';
import { useSystemInitializationCheck } from '../hooks/useSystemStatus';
import { usePostInitNavigation } from '../hooks/usePostInitNavigation';
import WelcomeScreen from '../components/auth/WelcomeScreen';
import InitializationSuccess from '../components/auth/InitializationSuccess';
import InitializationErrorRecovery, { ErrorReport } from '../components/auth/InitializationErrorRecovery';
import { InitializationResult, SystemInitializationError } from '../services/system.service';

interface WelcomePageProps {
  onComplete: () => void;
}

type WelcomeMode = 'loading' | 'system_init' | 'runtime_setup' | 'initialization_success' | 'initialization_error' | 'complete';

function WelcomePage({ onComplete }: WelcomePageProps) {
  const { isSystemInitialized, user } = useAuthentication();
  const { needsInitialization, loading: checkingInit, error: initCheckError } = useSystemInitializationCheck();
  const { navigateAfterInit } = usePostInitNavigation();

  // State management
  const [welcomeMode, setWelcomeMode] = useState<WelcomeMode>('loading');
  const [initializationResult, setInitializationResult] = useState<InitializationResult | null>(null);
  const [initializationError, setInitializationError] = useState<SystemInitializationError | Error | null>(null);

  // Determine welcome mode based on system state
  useEffect(() => {
    if (checkingInit) {
      setWelcomeMode('loading');
      return;
    }

    if (initCheckError) {
      console.error('System initialization check failed:', initCheckError);
      // On error, assume system needs initialization for safety
      setWelcomeMode('system_init');
      return;
    }

    // Auto-determine mode based on system state
    if (needsInitialization === true) {
      // 1) If system is not initialized -> start init flow
      setWelcomeMode('system_init');
    } else if (needsInitialization === false) {
      // System is initialized and user is authenticated (handled by auth middleware)
      // 3) If authenticated AND system is initialized -> display the WelcomeWorkflow
      setWelcomeMode('runtime_setup');
    }
  }, [checkingInit, initCheckError, needsInitialization, isSystemInitialized, user]);

  // Handle system initialization completion
  const handleInitializationComplete = useCallback(async (result: InitializationResult) => {
    setInitializationResult(result);
    // 4) At the end of the init flow, display the WelcomeWorkflow
    setWelcomeMode('runtime_setup');
  }, []);

  // Handle success screen continuation
  const handleSuccessContinue = useCallback(async () => {
    if (initializationResult) {
      try {
        await navigateAfterInit(initializationResult);
      } catch (error) {
        console.error('Navigation after initialization failed:', error);
        // Fall back to completing the welcome flow
        onComplete();
      }
    } else {
      onComplete();
    }
  }, [initializationResult, navigateAfterInit, onComplete]);

  // Handle error recovery actions
  const handleRetryInitialization = useCallback(async () => {
    setInitializationError(null);
    setWelcomeMode('system_init');
  }, []);

  const handleModifyConfiguration = useCallback(() => {
    setInitializationError(null);
    setWelcomeMode('system_init');
  }, []);

  const handleResetInitialization = useCallback(() => {
    setInitializationError(null);
    setInitializationResult(null);
    setWelcomeMode('system_init');
  }, []);

  const handleContactSupport = useCallback((report: ErrorReport) => {
    console.log('Support contact requested with report:', report);
    // TODO: Implement actual support contact functionality
    alert('Support contact functionality would be implemented here.');
  }, []);

  // Render based on welcome mode
  switch (welcomeMode) {
    case 'loading':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Checking system status...</p>
          </div>
        </div>
      );

    case 'system_init':
      return (
        <WelcomeScreen
          onInitializationComplete={handleInitializationComplete}
        />
      );

    case 'initialization_success':
      if (initializationResult) {
        return (
          <InitializationSuccess
            initializationResult={initializationResult}
            onContinue={handleSuccessContinue}
            onExploreFeatures={() => {
              // TODO: Implement feature exploration
              handleSuccessContinue();
            }}
          />
        );
      }
      // Fallback if no result available
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <p className="text-gray-600">Initialization completed but result is missing</p>
            <button
              onClick={onComplete}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );

    case 'initialization_error':
      if (initializationError) {
        return (
          <InitializationErrorRecovery
            error={initializationError}
            systemConfig={{
              adminEmail: '',
              adminPassword: '',
              acceptTerms: false,
            }}
            onRetry={handleRetryInitialization}
            onModifyConfig={handleModifyConfiguration}
            onReset={handleResetInitialization}
            onContactSupport={handleContactSupport}
          />
        );
      }
      // Fallback if no error available
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <p className="text-gray-600">An initialization error occurred</p>
            <button
              onClick={handleResetInitialization}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );

    case 'runtime_setup':
      // Show WelcomeWorkflow for authenticated users with initialized system
      return (
        <div className="relative h-screen bg-gray-50" id="welcome-page">
          <WelcomeWorkflow onComplete={() => { onComplete() }} />
        </div>
      );

    case 'complete':
    default:
      // System is fully set up, complete the welcome flow
      onComplete();
      return null;
  }

}

export default WelcomePage;

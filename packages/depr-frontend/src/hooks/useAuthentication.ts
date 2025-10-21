/**
 * useAuthentication Hook
 *
 * Custom hook to access the authentication context with proper error handling
 * and type safety. Ensures components can only be used within an authentication provider.
 */

import { useContext } from 'react';
import { AuthenticationContext, AuthContextType } from '../contexts/AuthenticationContext';

export function useAuthentication(): AuthContextType {
  const context = useContext(AuthenticationContext);

  if (context === undefined) {
    throw new Error(
      'useAuthentication must be used within an AuthenticationProvider. ' +
      'Make sure your component is wrapped with an AuthenticationProvider.'
    );
  }

  return context;
}

export default useAuthentication;
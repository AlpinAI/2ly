import { FastifyInstance } from 'fastify';
import { Container } from 'inversify';
import { OAuthService } from '../services/oauth';
import { LoggerService } from '@skilder-ai/common';

interface OAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export function registerOAuthRoutes(fastify: FastifyInstance, container: Container): void {
  const oauthService = container.get(OAuthService);
  const logger = container.get(LoggerService).getLogger('oauth.routes');

  // Get frontend URL from environment
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8888';

  /**
   * OAuth Callback Handler
   *
   * This endpoint receives the OAuth callback from providers (Google, Microsoft, Notion)
   * after user authorization. It exchanges the code for tokens and redirects to frontend.
   *
   * GET /oauth/callback?code=...&state=...
   */
  fastify.get<{ Querystring: OAuthCallbackQuery }>(
    '/oauth/callback',
    async (request, reply) => {
      const { code, state, error, error_description } = request.query;

      logger.info('Received OAuth callback');

      // Handle OAuth error from provider
      if (error) {
        logger.warn(`OAuth error from provider: ${error} - ${error_description}`);
        const errorUrl = new URL(`${frontendUrl}/oauth/error`);
        errorUrl.searchParams.set('error', error);
        if (error_description) {
          errorUrl.searchParams.set('error_description', error_description);
        }
        return reply.redirect(errorUrl.toString());
      }

      // Validate required parameters
      if (!code || !state) {
        logger.warn('Missing code or state in OAuth callback');
        const errorUrl = new URL(`${frontendUrl}/oauth/error`);
        errorUrl.searchParams.set('error', 'missing_params');
        errorUrl.searchParams.set('error_description', 'Missing authorization code or state');
        return reply.redirect(errorUrl.toString());
      }

      // Process the OAuth callback
      const result = await oauthService.handleOAuthCallback(code, state);

      // Build redirect URL
      const workspaceId = result.workspaceId || 'default';
      const redirectUrl = new URL(`${frontendUrl}/w/${workspaceId}/my-integrations`);

      if (result.success && result.connection) {
        // Success - add success parameter with provider type
        redirectUrl.searchParams.set('success', result.connection.provider.toLowerCase());
        logger.info(`OAuth connection successful for provider ${result.connection.provider}`);
      } else {
        // Error - add error parameters
        redirectUrl.searchParams.set('error', 'connection_failed');
        if (result.error) {
          redirectUrl.searchParams.set('error_description', result.error);
        }
        logger.warn(`OAuth connection failed: ${result.error}`);
      }

      return reply.redirect(redirectUrl.toString());
    }
  );

  logger.info('OAuth routes registered');
}

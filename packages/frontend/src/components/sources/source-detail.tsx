/**
 * SourceDetail Component
 *
 * WHY: Router component that renders the correct detail panel
 * based on source type (MCP Server vs REST API).
 *
 * ARCHITECTURE:
 * - Uses discriminated union based on source.type
 * - Routes to type-specific detail components
 * - Provides fallback for unknown types
 *
 * USAGE:
 * ```tsx
 * <SourceDetail source={selectedSource} />
 * ```
 */

import { SourceType, type Source } from '@/types/sources';
import { MCPServerDetail } from './mcp-server-detail';
import { RESTAPISourceDetail } from './rest-api-source-detail';

export interface SourceDetailProps {
  source: Source;
}

export function SourceDetail({ source }: SourceDetailProps) {
  switch (source.type) {
    case SourceType.MCP_SERVER:
      return <MCPServerDetail server={source} />;
    case SourceType.REST_API:
      // REST API sources are not yet implemented, but we have a placeholder UI
      // Cast to unknown first, then to RESTAPISource to satisfy TypeScript
      return <RESTAPISourceDetail source={source as unknown as import('@/types/sources').RESTAPISource} />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Unknown source type</p>
          </div>
        </div>
      );
  }
}

/**
 * useSkills Hook
 *
 * WHY: Fetches Skills with real-time updates and client-side filtering.
 * Replaces useAgents which filtered runtimes by "agent" capability.
 *
 * PATTERN: Query + subscription pattern (same as useMCPServers)
 * - useQuery with cache-only for instant data from cache
 * - useSubscription for real-time updates
 * - Subscription writes to query cache for persistence
 * - useMemo for client-side filtering
 * - Search includes tool names
 *
 * ARCHITECTURE:
 * - Skills are first-class entities (not filtered runtimes)
 * - Apollo cache automatically updates on subscription events
 * - No manual store management needed
 *
 * USAGE:
 * ```tsx
 * function SkillsPage() {
 *   const { skills, filteredSkills, loading, error, filters } = useSkills(workspaceId);
 *
 *   return (
 *     <div>
 *       <Search value={filters.search} onChange={filters.setSearch} />
 *       <SkillTable skills={filteredSkills} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import {
  GetSkillsDocument,
  SubscribeSkillsDocument,
} from '@/graphql/generated/graphql';

export function useSkills(workspaceId: string) {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // 1️⃣ Read cached skills first (fetchPolicy: cache-only)
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(
    GetSkillsDocument,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      fetchPolicy: 'cache-only', // use cache if available, otherwise fetch
    }
  );

  // 2️⃣ Start subscription for live updates
  useSubscription(SubscribeSkillsDocument, {
    variables: { workspaceId },
    skip: !workspaceId,
    onData: ({ client, data }) => {
      const newSkills = data?.data?.skills;
      if (newSkills) {
        // 3️⃣ Merge subscription updates into Apollo cache
        client.writeQuery({
          query: GetSkillsDocument,
          variables: { workspaceId },
          data: { skills: newSkills },
        });
      }
    },
  });

  // 4️⃣ Extract skills from query cache (initial data + subscription updates)
  const allSkills = queryData?.skills ?? [];

  // Client-side filtering
  const filteredSkills = useMemo(() => {
    let result = [...allSkills];

    // Search filter (name + description + tool names)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter((skill) => {
        // Search in name and description
        const nameMatch = skill.name.toLowerCase().includes(query);
        const descMatch = skill.description?.toLowerCase().includes(query);

        // Search in tool names
        const toolMatch = skill.mcpTools?.some((tool: { name: string }) =>
          tool.name.toLowerCase().includes(query)
        );

        return nameMatch || descMatch || toolMatch;
      });
    }

    return result;
  }, [allSkills, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: allSkills.length,
      filtered: filteredSkills.length,
    };
  }, [allSkills, filteredSkills]);

  return {
    skills: allSkills,
    filteredSkills,
    loading: queryLoading,
    error: queryError,
    stats,
    filters: {
      search: searchTerm,
      setSearch: setSearchTerm,
      reset: () => {
        setSearchTerm('');
      },
    },
  };
}

/**
 * DashboardPage Component
 *
 * WHY: Provides comprehensive operational metrics and system overview.
 * Displays call volume, success rates, resource counts, and recent errors
 * with an appealing, user-friendly interface.
 *
 * FEATURES:
 * - Time range selector (24h/7d/30d)
 * - Key metrics grid (Total Calls, Success Rate, Active Tool Sets, Token Volume)
 * - Resource overview (Sources, Tools, Tool Sets)
 * - Call volume visualization chart
 * - Recent errors table
 * - Auto-refresh every 30 seconds
 * - Responsive layout with dark mode support
 */

import { useState, useMemo } from 'react';
import { Phone, TrendingUp, Server, Coins } from 'lucide-react';
import { TimeRangeSelector, type TimeRange } from '@/components/dashboard/TimeRangeSelector';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ResourceStatsBar } from '@/components/dashboard/ResourceStatsBar';
import { CallVolumeChart, type ChartDataPoint } from '@/components/dashboard/CallVolumeChart';
import { RecentErrorsTable } from '@/components/dashboard/RecentErrorsTable';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useToolCalls } from '@/hooks/useToolCalls';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingSection } from '@/components/onboarding/onboarding-section';
import { ToolCallStatus } from '@/graphql/generated/graphql';
import { subDays, subHours, startOfHour, startOfDay, format, isAfter } from 'date-fns';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Data hooks with auto-refresh
  const { runtimes, loading: runtimesLoading } = useRuntimeData();
  const { servers, loading: serversLoading } = useMCPServers();
  const { tools, loading: toolsLoading } = useMCPTools();
  const { toolCalls, loading: toolCallsLoading } = useToolCalls({
    pollInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Onboarding
  const { visibleSteps, isOnboardingComplete, isOnboardingVisible, hideOnboarding } = useOnboarding();

  // Calculate time range boundaries
  const timeRangeBoundary = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return subHours(now, 24);
      case '7d':
        return subDays(now, 7);
      case '30d':
        return subDays(now, 30);
      default:
        return subHours(now, 24);
    }
  }, [timeRange]);

  // Filter tool calls by time range
  const filteredToolCalls = useMemo(() => {
    return toolCalls.filter((call) => {
      const callDate = new Date(call.calledAt);
      return isAfter(callDate, timeRangeBoundary);
    });
  }, [toolCalls, timeRangeBoundary]);

  // Aggregate tool calls for chart
  const chartData = useMemo((): ChartDataPoint[] => {
    if (filteredToolCalls.length === 0) return [];

    const buckets = new Map<string, { success: number; failed: number; timestamp: Date }>();

    // Determine bucket size based on time range
    const bucketFn = timeRange === '24h' ? startOfHour : startOfDay;
    const formatFn = timeRange === '24h' ? (d: Date) => format(d, 'HH:mm') : (d: Date) => format(d, 'MMM dd');

    // Initialize buckets
    const now = new Date();
    const numBuckets = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;

    for (let i = numBuckets - 1; i >= 0; i--) {
      const timestamp = timeRange === '24h'
        ? subHours(now, i)
        : subDays(now, i);
      const bucketKey = bucketFn(timestamp).toISOString();
      buckets.set(bucketKey, { success: 0, failed: 0, timestamp: bucketFn(timestamp) });
    }

    // Aggregate calls into buckets
    filteredToolCalls.forEach((call) => {
      const callDate = new Date(call.calledAt);
      const bucketKey = bucketFn(callDate).toISOString();

      if (buckets.has(bucketKey)) {
        const bucket = buckets.get(bucketKey)!;
        if (call.status === ToolCallStatus.Completed) {
          bucket.success++;
        } else if (call.status === ToolCallStatus.Failed) {
          bucket.failed++;
        }
      }
    });

    // Convert to array and format labels
    return Array.from(buckets.values()).map((bucket) => ({
      label: formatFn(bucket.timestamp),
      success: bucket.success,
      failed: bucket.failed,
      timestamp: bucket.timestamp,
    }));
  }, [filteredToolCalls, timeRange, timeRangeBoundary]);

  // Calculate metrics
  const totalCalls = filteredToolCalls.length;
  const successfulCalls = filteredToolCalls.filter((c) => c.status === ToolCallStatus.Completed).length;
  const failedCalls = filteredToolCalls.filter((c) => c.status === ToolCallStatus.Failed).length;
  const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : '0.0';

  // Get recent errors (last 10 failed calls)
  const recentErrors = useMemo(() => {
    return filteredToolCalls
      .filter((call) => call.status === ToolCallStatus.Failed)
      .sort((a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime())
      .slice(0, 10);
  }, [filteredToolCalls]);

  // Tool set stats (only count runtimes with 'agent' capability, excludes global runtime)
  const toolSets = useMemo(() => {
    return runtimes.filter((runtime) => runtime.capabilities?.includes('agent'));
  }, [runtimes]);

  const toolSetStats = useMemo(() => {
    const active = toolSets.filter((ts) => ts.status === 'ACTIVE').length;
    const inactive = toolSets.filter((ts) => ts.status === 'INACTIVE').length;
    return {
      total: toolSets.length,
      active,
      inactive,
    };
  }, [toolSets]);

  const resourceStats = {
    sources: servers.length,
    tools: tools.length,
    toolSets: toolSets.length,
  };

  const loading = runtimesLoading || serversLoading || toolsLoading || toolCallsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Show onboarding OR dashboard, not both */}
      {isOnboardingVisible && visibleSteps.length > 0 ? (
        <OnboardingSection
          steps={visibleSteps}
          isComplete={isOnboardingComplete}
          onHide={hideOnboarding}
        />
      ) : (
        <div className="space-y-6">
          {/* Header with Time Range Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h2>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          {/* Hero Section - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Calls"
              value={totalCalls}
              icon={Phone}
              iconBgColor="bg-cyan-100 dark:bg-cyan-900/30"
              iconColor="text-cyan-600 dark:text-cyan-400"
              valueColor="text-cyan-600"
              loading={loading}
            />

            <MetricCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={TrendingUp}
              iconBgColor="bg-green-100 dark:bg-green-900/30"
              iconColor="text-green-600 dark:text-green-400"
              valueColor="text-green-600"
              subtitle={`${successfulCalls} successful, ${failedCalls} failed`}
              loading={loading}
            />

            <MetricCard
              title="Active Tool Sets"
              value={toolSetStats.active}
              icon={Server}
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              valueColor="text-blue-600"
              subtitle={`${toolSetStats.total} total, ${toolSetStats.inactive} inactive`}
              loading={runtimesLoading}
            />

            <MetricCard
              title="Token Volume"
              value="Coming Soon"
              icon={Coins}
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
              valueColor="text-purple-600"
              subtitle="Token tracking in development"
              loading={false}
            />
          </div>

          {/* Resource Overview */}
          <ResourceStatsBar
            stats={resourceStats}
            loading={serversLoading || toolsLoading || runtimesLoading}
          />

          {/* Call Volume Visualization */}
          <CallVolumeChart data={chartData} loading={loading} />

          {/* Recent Errors */}
          <RecentErrorsTable errors={recentErrors} loading={loading} />
        </div>
      )}
    </div>
  );
}

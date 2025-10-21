import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Wrench, CookingPot, ArrowRight, Plus, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatsCard from '../components/dashboard/StatsCard';
import AgentCard from '../components/dashboard/AgentCard';
import ToolCard from '../components/dashboard/ToolCard';
import { mockAgents, mockTools, mockToolUsage } from '../utils/mockData';
import { apolloResolversTypes } from '@2ly/common';
import UsageChart from '../components/monitoring/UsageChart';

const activeStatus = 'active' as apolloResolversTypes.ActiveStatus;

const Dashboard: React.FC = () => {
  // Get only the first 3 agents and tools for the dashboard preview
  const previewAgents = mockAgents.slice(0, 3);
  const previewTools = mockTools.slice(0, 3);

  // Calculate some stats for the dashboard
  const activeAgents = mockAgents.filter((agent) => agent.status === activeStatus).length;
  const connectedAgents = mockAgents.filter((agent) => agent.connected).length;
  const totalToolUses = mockTools.reduce((sum, tool) => sum + tool.usage, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500">Welcome back to your agent management hub.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
            New Agent
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Tool</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Agents" value={mockAgents.length} icon={<Cpu className="h-4 w-4" />} change={15} />
        <StatsCard
          title="Active Agents"
          value={`${activeAgents}/${mockAgents.length}`}
          icon={<Activity className="h-4 w-4" />}
          change={8}
        />
        <StatsCard title="Available Tools" value={mockTools.length} icon={<Wrench className="h-4 w-4" />} change={25} />
        <StatsCard title="Tool Usage" value={totalToolUses} icon={<Activity className="h-4 w-4" />} change={32} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageChart data={mockToolUsage} title="Recent Tool Activity" type="line" />

        <Card>
          <CardHeader>
            <CardTitle>Connected Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="mr-4 text-2xl font-bold text-primary-600">
                  {connectedAgents}/{mockAgents.length}
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width: `${(connectedAgents / mockAgents.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-medium">Agent Distribution</h4>
                <div className="space-y-2">
                  {['Customer Service', 'Sales', 'HR', 'Data Processing'].map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`mr-2 h-3 w-3 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][index]
                            }`}
                        ></div>
                        <span className="text-sm">{category}</span>
                      </div>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 5) + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Agents</h2>
          <Link to="/agents" className="flex items-center text-sm text-primary-600 hover:text-primary-800">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previewAgents.map((agent) => {
            // Map agent tool IDs to actual tool objects
            const agentTools = agent.tools
              .map((toolId: string) => mockTools.find((tool) => tool.id === toolId))
              .filter((tool): tool is (typeof mockTools)[0] => tool !== undefined);

            return <AgentCard key={agent.id} agent={agent} tools={agentTools} />;
          })}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Popular Tools</h2>
          <Link to="/tools" className="flex items-center text-sm text-primary-600 hover:text-primary-800">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previewTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      <motion.div
        className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <CookingPot className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-medium">Create Your First Recipe</h3>
        <p className="mb-4 text-gray-600">
          Save time by creating a collection of tools that can be applied to multiple agents at once.
        </p>
        <Link to="/recipes">
          <Button variant="outline">Create Recipe</Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default Dashboard;

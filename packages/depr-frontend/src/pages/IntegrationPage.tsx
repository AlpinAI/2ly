import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, ArrowRight, Check, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { mockAgents } from '../utils/mockData';

const IntegrationPage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [langflowUrl, setLangflowUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const handleConnect = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 2000);
  };
  
  const connectionSteps = [
    {
      title: 'Connect to Langflow',
      description: 'Enter your Langflow URL and API key',
      status: connectionStatus !== 'disconnected' ? 'complete' : 'current',
    },
    {
      title: 'Discover Agents',
      description: 'We scan your Langflow for available agents',
      status: connectionStatus === 'connected' ? 'complete' : 'pending',
    },
    {
      title: 'Configure Agents',
      description: 'Attach 2LY Clients to your agents',
      status: 'pending',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Langflow Integration</h1>
        <p className="text-gray-500">Connect your Langflow instance to manage your agents and tools.</p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connect to Langflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="langflow-url">
                  Langflow URL
                </label>
                <input
                  id="langflow-url"
                  className="input"
                  type="url"
                  placeholder="https://your-langflow-instance.com"
                  value={langflowUrl}
                  onChange={(e) => setLangflowUrl(e.target.value)}
                  disabled={connectionStatus !== 'disconnected'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="api-key">
                  API Key
                </label>
                <input
                  id="api-key"
                  className="input"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={connectionStatus !== 'disconnected'}
                />
              </div>
              {connectionStatus === 'connected' && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Successfully connected to Langflow
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              disabled={connectionStatus !== 'disconnected'}
            >
              Cancel
            </Button>
            {connectionStatus === 'disconnected' ? (
              <Button
                leftIcon={<Link className="h-4 w-4" />}
                onClick={handleConnect}
                disabled={!langflowUrl || !apiKey}
              >
                Connect
              </Button>
            ) : connectionStatus === 'connecting' ? (
              <Button isLoading>
                Connecting...
              </Button>
            ) : (
              <Button
                variant="outline"
                leftIcon={<ArrowRight className="h-4 w-4" />}
              >
                View Agents
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Connection Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-8">
              {/* Vertical line connecting steps */}
              <div className="absolute inset-0 flex justify-center">
                <div className="w-0.5 bg-gray-200"></div>
              </div>
              
              {connectionSteps.map((step, index) => (
                <div key={index} className="relative flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      step.status === 'complete' 
                        ? 'border-green-500 bg-green-500 text-white'
                        : step.status === 'current'
                          ? 'border-primary-500 bg-white text-primary-500'
                          : 'border-gray-300 bg-white text-gray-300'
                    }`}>
                      {step.status === 'complete' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium ${
                      step.status === 'pending' ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {connectionStatus === 'connected' && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Discovered Agents</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockAgents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="flex h-full flex-col">
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.flow}</p>
                      </div>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        agent.connected 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {agent.connected ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-600">{agent.description}</p>
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 p-4">
                    <Button
                      className="w-full"
                      variant={agent.connected ? "outline" : "primary"}
                      size="sm"
                    >
                      {agent.connected ? "Manage Tools" : "Attach Client"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">How Langflow Integration Works</h2>
        <p className="mb-4 text-gray-600">
          2LY connects to your Langflow instance and provides a seamless way to manage the tools 
          available to your agents. Here's how it works:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-gray-600">
          <li>Connect 2LY to your Langflow instance using your API key</li>
          <li>2LY discovers all your existing agents and workflows</li>
          <li>Attach a 2LY Client to any agent to manage its tools</li>
          <li>Add, remove, and configure tools for each agent from 2LY</li>
          <li>Monitor tool usage and performance in real-time</li>
        </ol>
      </div>
    </div>
  );
};

export default IntegrationPage;
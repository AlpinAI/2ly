"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Settings,
  Zap,
  Bot,
  Network,
  Workflow,
  Code,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Play,
  X,
  Plus,
  ExternalLink,
  Server,
  Database,
  Mail,
  HardDrive,
  Globe2,
  FileCode,
  Cpu,
  Cloud
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentDeploymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDarkMode: boolean;
}

const AgentDeploymentModal = ({ open, onOpenChange, isDarkMode }: AgentDeploymentModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFramework, setSelectedFramework] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [agentDetected, setAgentDetected] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedRuntime, setSelectedRuntime] = useState("Main Runtime");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setSelectedFramework("");
      setIsDetecting(false);
      setAgentDetected(false);
      setCopiedCode(false);
      setSelectedRuntime("Main Runtime");
    }
  }, [open]);

  // Dynamic classes based on theme - matching dashboard exactly
  const themeClasses = {
    background: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-500" : "text-gray-500",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    cardBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    modalBg: isDarkMode ? "bg-gray-800" : "bg-white",
    modalBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    inputBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-300",
    codeBg: isDarkMode ? "bg-gray-900" : "bg-gray-900",
    hoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
    chartBg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    chartBorder: isDarkMode ? "border-gray-700" : "border-gray-200"
  };

  const frameworks = [
    {
      id: "langchain",
      name: "LangChain Integration",
      description: "Using our MCP Connector",
      icon: Bot,
      color: "bg-blue-500",
      available: true
    },
    {
      id: "langflow",
      name: "Langflow Integration", 
      description: "With the MCP Node",
      icon: Workflow,
      color: "bg-purple-500",
      available: true
    },
    {
      id: "n8n",
      name: "n8n Workflow",
      description: "Connect via MCP Client Node",
      icon: Network,
      color: "bg-red-500",
      available: true
    }
  ];

  const additionalOptions = [
    { id: "zapier", name: "Zapier", icon: Zap, color: "bg-orange-500", available: false },
    { id: "crewai", name: "CrewAI", icon: Bot, color: "bg-green-500", available: false },
    { id: "claude", name: "Claude Desktop", icon: Terminal, color: "bg-gray-700", available: false },
    { id: "mcp-inspector", name: "MCP Inspector", icon: Settings, color: "bg-blue-600", available: false }
  ];

  const getCodeSnippet = () => {
    switch (selectedFramework) {
      case "langflow":
        return `{
  "mcpServers": {
    "2ly": {
      "command": "npx",
      "args": [
        "@2ly/runtime"
      ],
      "env": {
        "NATS_SERVERS": "nats://nats:4222",
        "RUNTIME_NAME": "My Agent"
      }
    }
  }
}`;
      case "langchain":
        return `from langchain_community.tools import MCPTool
from mcp import ClientSession

# Initialize 2LY MCP connection
session = ClientSession()
tools = MCPTool.from_mcp_session(
    session,
    server_params={
        "command": "npx",
        "args": ["@2ly/runtime"],
        "env": {
            "NATS_SERVERS": "nats://nats:4222",
            "RUNTIME_NAME": "My Agent"
        }
    }
)`;
      case "n8n":
        return `{
  "mcpServers": {
    "2ly": {
      "command": "npx",
      "args": ["@2ly/runtime"],
      "env": {
        "NATS_SERVERS": "nats://nats:4222",
        "RUNTIME_NAME": "My Agent"
      }
    }
  }
}`;
      default:
        return "";
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getCodeSnippet());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleFrameworkSelect = (frameworkId: string) => {
    const framework = [...frameworks, ...additionalOptions].find(f => f.id === frameworkId);
    if (framework?.available) {
      setSelectedFramework(frameworkId);
      setTimeout(() => {
        setCurrentStep(2);
        // Start detection simulation
        setIsDetecting(true);
        setTimeout(() => {
          setIsDetecting(false);
          setAgentDetected(true);
        }, 3000);
      }, 500);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setIsDetecting(false);
      setAgentDetected(false);
    }
  };

  const handleManageTools = () => {
    onOpenChange(false);
    // Here you would navigate to tools management
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${themeClasses.modalBg} ${themeClasses.modalBorder} max-w-6xl max-h-[90vh] overflow-y-auto shadow-lg`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${themeClasses.text} text-center`}>
            {currentStep === 1 ? "Connect Your Agent" : "Configure Agent Connection"}
          </DialogTitle>
          <p className={`${themeClasses.textSecondary} text-center mt-2`}>
            {currentStep === 1 
              ? "Choose the platform or framework where your AI agent is running"
              : "Set up the connection and test your agent integration"
            }
          </p>
        </DialogHeader>

        <div className="mt-6">
          {/* Step 1: Framework Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Main Framework Options */}
              <div>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Popular Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {frameworks.map((framework) => {
                    const IconComponent = framework.icon;
                    return (
                      <Card 
                        key={framework.id}
                        className={`${themeClasses.cardBg} ${themeClasses.cardBorder} cursor-pointer transition-all duration-200 hover:shadow-md ${themeClasses.hoverBg} border`}
                        onClick={() => handleFrameworkSelect(framework.id)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className={`w-16 h-16 ${framework.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          <h3 className={`font-semibold text-lg ${themeClasses.text} mb-2`}>
                            {framework.name}
                          </h3>
                          <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                            {framework.description}
                          </p>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Available
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>More Integrations</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {additionalOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <Card
                        key={option.id}
                        className={`${themeClasses.cardBg} ${themeClasses.cardBorder} ${
                          option.available 
                            ? `cursor-pointer transition-all duration-200 hover:shadow-md ${themeClasses.hoverBg}` 
                            : 'opacity-50 cursor-not-allowed'
                        } border`}
                        onClick={() => option.available && handleFrameworkSelect(option.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-10 h-10 ${option.available ? option.color : 'bg-gray-400'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <h4 className={`font-medium text-sm ${themeClasses.text} mb-1`}>
                            {option.name}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              option.available 
                                ? "text-green-600 border-green-600" 
                                : "text-gray-500 border-gray-500"
                            }`}
                          >
                            {option.available ? "Available" : "Coming Soon"}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Manual Option */}
              <div className={`border-t ${themeClasses.cardBorder} pt-6`}>
                <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className={`font-medium ${themeClasses.text}`}>Manual Configuration</h4>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            Set up a custom integration or configure manually
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleFrameworkSelect("manual")}
                        className={`${themeClasses.cardBorder} ${themeClasses.textSecondary}`}
                      >
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Help Text */}
              <div className={`text-center space-y-2 p-4 ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder}`}>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  Once you connect an agent, you'll be able to manage its tools and monitor its activity.
                </p>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  Use Manual Configuration if your platform isn't listed above.
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-8 h-1 bg-cyan-600 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
          )}

          {/* Step 2: Configuration and Detection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Back Button and Framework Selection */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className={`${themeClasses.textSecondary} hover:${themeClasses.text}`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    {selectedFramework === "langflow" && <Workflow className="h-5 w-5 text-purple-500" />}
                    {selectedFramework === "langchain" && <Bot className="h-5 w-5 text-blue-500" />}
                    {selectedFramework === "n8n" && <Network className="h-5 w-5 text-red-500" />}
                    <span className={`font-medium ${themeClasses.text}`}>
                      {frameworks.find(f => f.id === selectedFramework)?.name || "Manual Configuration"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <div className="space-y-4">
                  <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                    <CardHeader>
                      <CardTitle className={`text-lg ${themeClasses.text} flex items-center`}>
                        <Code className="h-5 w-5 mr-2 text-cyan-600" />
                        Configuration Setup
                      </CardTitle>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Add this configuration to connect your agent to 2LY
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Code Block */}
                      <div className="relative">
                        <div className={`${themeClasses.codeBg} rounded-lg p-4 font-mono text-sm overflow-x-auto border ${themeClasses.chartBorder}`}>
                          <pre className="text-green-400 whitespace-pre-wrap">
                            {getCodeSnippet()}
                          </pre>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={handleCopyCode}
                        >
                          {copiedCode ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className={`p-4 ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder}`}>
                        <h4 className={`font-medium ${themeClasses.text} mb-2`}>Setup Instructions:</h4>
                        <ol className={`text-sm ${themeClasses.textSecondary} space-y-1 list-decimal list-inside`}>
                          <li>Copy the configuration above</li>
                          <li>Add it to your {frameworks.find(f => f.id === selectedFramework)?.name} setup</li>
                          <li>Start your agent with the new configuration</li>
                          <li>The connection will be detected automatically</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detection Panel */}
                <div className="space-y-4">
                  <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                    <CardHeader>
                      <CardTitle className={`text-lg ${themeClasses.text} flex items-center`}>
                        <Terminal className="h-5 w-5 mr-2 text-green-600" />
                        Agent Detection
                      </CardTitle>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Waiting for your agent to connect
                      </p>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                      {isDetecting ? (
                        <>
                          <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                              Detecting Agent Connection
                            </h4>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                              We're scanning for your agent. This usually takes a few seconds...
                            </p>
                          </div>
                          <div className={`p-3 ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder}`}>
                            <p className={`text-xs ${themeClasses.textMuted}`}>
                              Make sure your agent is running with the configuration above
                            </p>
                          </div>
                        </>
                      ) : agentDetected ? (
                        <>
                          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                              Agent Connected Successfully!
                            </h4>
                            <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                              Your agent is now connected to 2LY and ready to use tools
                            </p>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              ✓ Connected
                            </Badge>
                          </div>
                          <div className={`p-4 ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder} text-left`}>
                            <h5 className={`font-medium ${themeClasses.text} mb-2`}>Agent Details:</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className={themeClasses.textSecondary}>Runtime:</span>
                                <span className={themeClasses.text}>{selectedRuntime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={themeClasses.textSecondary}>Framework:</span>
                                <span className={themeClasses.text}>{frameworks.find(f => f.id === selectedFramework)?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={themeClasses.textSecondary}>Status:</span>
                                <span className="text-green-600">Active</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Bot className="h-10 w-10 text-gray-400" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                              Ready to Detect
                            </h4>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                              Configure your agent with the code above, then we'll detect it automatically
                            </p>
                          </div>
                        </>
                      )}

                      {/* Runtime Selection */}
                      <div className={`pt-4 border-t ${themeClasses.cardBorder}`}>
                        <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                          Or select an existing runtime:
                        </p>
                        <Select value={selectedRuntime} onValueChange={setSelectedRuntime}>
                          <SelectTrigger className={`${themeClasses.inputBg} ${themeClasses.inputBorder}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={`${themeClasses.modalBg} ${themeClasses.modalBorder}`}>
                            <SelectItem value="Main Runtime" className={themeClasses.text}>Main Runtime</SelectItem>
                            <SelectItem value="Test Runtime" className={themeClasses.text}>Test Runtime</SelectItem>
                            <SelectItem value="Development Runtime" className={themeClasses.text}>Development Runtime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center space-x-2">
                <div className="w-8 h-1 bg-cyan-600 rounded"></div>
                <div className="w-8 h-1 bg-cyan-600 rounded"></div>
              </div>

              {/* Footer Button */}
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className={`${themeClasses.cardBorder} ${themeClasses.textSecondary}`}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-cyan-600 text-white hover:bg-cyan-700"
                  onClick={handleManageTools}
                  disabled={!agentDetected}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Manage Tools
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDeploymentModal;
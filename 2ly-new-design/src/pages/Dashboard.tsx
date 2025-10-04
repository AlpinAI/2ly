"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Bot, 
  CheckCircle, 
  Clock, 
  Database, 
  GitBranch, 
  Globe, 
  Home, 
  Layers, 
  LineChart, 
  Monitor, 
  Network, 
  Play, 
  Settings, 
  Shield, 
  Smartphone, 
  Terminal, 
  TrendingUp, 
  Users, 
  Wrench, 
  Zap,
  ChevronDown,
  Search,
  Bell,
  User,
  Menu,
  Moon,
  Sun,
  Rocket,
  ChevronRight,
  Building2,
  Filter,
  Star,
  Download,
  ExternalLink,
  Code,
  Send,
  Copy,
  Maximize2,
  Minimize2,
  RotateCcw,
  BookOpen,
  Tag,
  Calendar,
  Eye,
  MessageSquare,
  FileText,
  Cpu,
  Cloud,
  Smartphone as Mobile,
  Mail,
  Image,
  Video,
  Music,
  FileCode,
  Palette,
  Calculator,
  Lock,
  Key,
  Wifi,
  HardDrive,
  Server,
  Globe2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AgentDeploymentModal from "@/components/AgentDeploymentModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("tools");
  const [activeSubSection, setActiveSubSection] = useState("catalog");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("Production");
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  
  // Tool Catalog states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  
  // Playground states
  const [selectedTool, setSelectedTool] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: "system", content: "Welcome to the 2LY Playground! Select a tool and start interacting.", timestamp: new Date() }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([
    { id: 1, type: "info", content: "2LY Playground Console initialized", timestamp: new Date() },
    { id: 2, type: "info", content: "Ready for tool execution", timestamp: new Date() }
  ]);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  // Mock data for workspaces
  const workspaces = [
    { id: "prod", name: "Production", description: "Live environment" },
    { id: "staging", name: "Staging", description: "Testing environment" },
    { id: "dev", name: "Development", description: "Development environment" },
    { id: "sandbox", name: "Sandbox", description: "Experimental environment" }
  ];

  // Mock user data
  const currentUser = {
    name: "Alex Chen",
    email: "alex.chen@company.com",
    role: "AI Engineer"
  };

  // Mock tools data for catalog
  const toolCategories = [
    { id: "all", name: "All Tools", count: 47 },
    { id: "data", name: "Data & Analytics", count: 12 },
    { id: "ai", name: "AI & ML", count: 8 },
    { id: "communication", name: "Communication", count: 6 },
    { id: "productivity", name: "Productivity", count: 9 },
    { id: "security", name: "Security", count: 5 },
    { id: "development", name: "Development", count: 7 }
  ];

  const mockTools = [
    {
      id: "postgresql",
      name: "PostgreSQL",
      description: "Advanced open-source relational database with powerful querying capabilities",
      category: "data",
      icon: Database,
      rating: 4.8,
      downloads: 15420,
      lastUpdated: "2024-01-15",
      tags: ["database", "sql", "relational"],
      status: "active",
      version: "16.1",
      documentation: "https://postgresql.org/docs"
    },
    {
      id: "openai-gpt4",
      name: "OpenAI GPT-4",
      description: "Advanced language model for text generation, analysis, and conversation",
      category: "ai",
      icon: Bot,
      rating: 4.9,
      downloads: 28750,
      lastUpdated: "2024-01-20",
      tags: ["llm", "text-generation", "ai"],
      status: "active",
      version: "4.0",
      documentation: "https://openai.com/docs"
    },
    {
      id: "selenium",
      name: "Selenium WebDriver",
      description: "Automate web browsers for testing and web scraping tasks",
      category: "development",
      icon: Globe2,
      rating: 4.6,
      downloads: 12300,
      lastUpdated: "2024-01-18",
      tags: ["automation", "testing", "web-scraping"],
      status: "active",
      version: "4.16.0",
      documentation: "https://selenium.dev/docs"
    },
    {
      id: "gmail-api",
      name: "Gmail API",
      description: "Send, receive, and manage Gmail messages programmatically",
      category: "communication",
      icon: Mail,
      rating: 4.7,
      downloads: 9850,
      lastUpdated: "2024-01-12",
      tags: ["email", "google", "messaging"],
      status: "active",
      version: "v1",
      documentation: "https://developers.google.com/gmail/api"
    },
    {
      id: "dalle",
      name: "DALL-E 3",
      description: "Generate high-quality images from text descriptions",
      category: "ai",
      icon: Image,
      rating: 4.8,
      downloads: 18900,
      lastUpdated: "2024-01-22",
      tags: ["image-generation", "ai", "creative"],
      status: "active",
      version: "3.0",
      documentation: "https://openai.com/dall-e-3"
    },
    {
      id: "stripe",
      name: "Stripe Payments",
      description: "Process payments and manage financial transactions securely",
      category: "productivity",
      icon: Calculator,
      rating: 4.9,
      downloads: 22100,
      lastUpdated: "2024-01-19",
      tags: ["payments", "finance", "e-commerce"],
      status: "active",
      version: "2023-10-16",
      documentation: "https://stripe.com/docs"
    }
  ];

  // Mock data for the dashboard
  const stats = {
    totalAgents: 12,
    activeTools: 47,
    totalCalls: 15847,
    successRate: 99.2,
    avgResponseTime: 245,
    costSavings: 34.5
  };

  const recentActivity = [
    { id: 1, agent: "DataAnalyzer", tool: "PostgreSQL", status: "success", time: "2 min ago", duration: "1.2s" },
    { id: 2, agent: "ContentWriter", tool: "OpenAI GPT-4", status: "success", time: "3 min ago", duration: "2.8s" },
    { id: 3, agent: "WebScraper", tool: "Selenium", status: "warning", time: "5 min ago", duration: "4.1s" },
    { id: 4, agent: "EmailProcessor", tool: "Gmail API", status: "success", time: "7 min ago", duration: "0.9s" },
    { id: 5, agent: "ImageGenerator", tool: "DALL-E", status: "error", time: "12 min ago", duration: "timeout" }
  ];

  const topLevelSections = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "deployment", label: "Deployment", icon: Rocket },
    { id: "monitoring", label: "Monitoring", icon: Monitor },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const subSections = {
    overview: [
      { id: "dashboard", label: "Dashboard" },
      { id: "activity", label: "Recent Activity" },
      { id: "performance", label: "Performance" }
    ],
    agents: [
      { id: "agents", label: "All Agents" },
      { id: "relationships", label: "Relationships" },
      { id: "deployment", label: "Deployment" }
    ],
    tools: [
      { id: "catalog", label: "Tool Catalog" },
      { id: "integrations", label: "Integrations" },
      { id: "playground", label: "Playground" }
    ],
    deployment: [
      { id: "environments", label: "Environments" },
      { id: "pipelines", label: "Pipelines" },
      { id: "releases", label: "Releases" }
    ],
    monitoring: [
      { id: "realtime", label: "Real-time" },
      { id: "logs", label: "Audit Logs" },
      { id: "alerts", label: "Alerts" }
    ],
    settings: [
      { id: "general", label: "General" },
      { id: "security", label: "Security" },
      { id: "integrations", label: "Integrations" }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "error": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return CheckCircle;
      case "warning": return AlertTriangle;
      case "error": return AlertTriangle;
      default: return Clock;
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Filter tools based on search and category
  const filteredTools = mockTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort tools
  const sortedTools = [...filteredTools].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.downloads - a.downloads;
      case "rating":
        return b.rating - a.rating;
      case "recent":
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Handle playground chat
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedTool) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsExecuting(true);

    // Add console log for execution start
    const executionStart = {
      id: Date.now() + 1,
      type: "info",
      content: `Executing request with ${selectedTool}: "${currentMessage}"`,
      timestamp: new Date()
    };
    setConsoleOutput(prev => [...prev, executionStart]);

    // Simulate tool execution
    setTimeout(() => {
      const tool = mockTools.find(t => t.id === selectedTool);
      const mockResponse = {
        id: Date.now() + 2,
        type: "assistant",
        content: `I've executed your request using ${tool?.name}. Here's the result: [Mock response for "${currentMessage}"]`,
        timestamp: new Date()
      };

      const executionResult = {
        id: Date.now() + 3,
        type: "success",
        content: `Tool execution completed successfully. Response time: 1.2s`,
        timestamp: new Date()
      };

      const codeExecution = {
        id: Date.now() + 4,
        type: "code",
        content: `// Generated code for ${tool?.name}\nconst result = await ${tool?.id}.execute({\n  query: "${currentMessage}",\n  options: { timeout: 30000 }\n});\nconsole.log(result);`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, mockResponse]);
      setConsoleOutput(prev => [...prev, executionResult, codeExecution]);
      setIsExecuting(false);
    }, 2000);
  };

  // Dynamic classes based on theme
  const themeClasses = {
    background: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-500" : "text-gray-500",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    cardBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    headerBg: isDarkMode ? "bg-gray-900/95" : "bg-white/95",
    headerBorder: isDarkMode ? "border-gray-800" : "border-gray-200",
    navBg: isDarkMode ? "bg-gray-800/50" : "bg-gray-100/50",
    inputBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-300",
    inputText: isDarkMode ? "text-white" : "text-gray-900",
    inputPlaceholder: isDarkMode ? "placeholder-gray-400" : "placeholder-gray-500",
    chartBg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    chartBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    activityBg: isDarkMode ? "bg-gray-900" : "bg-gray-50"
  };

  // Get current section and subsection labels
  const getCurrentSectionLabel = () => {
    return topLevelSections.find(s => s.id === activeSection)?.label || "";
  };

  const getCurrentSubSectionLabel = () => {
    const currentSubSections = subSections[activeSection as keyof typeof subSections];
    return currentSubSections?.find(s => s.id === activeSubSection)?.label || "";
  };

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} font-mono`}>
      {/* Top Navigation Bar */}
      <header className={`border-b ${themeClasses.headerBorder} ${themeClasses.headerBg} backdrop-blur supports-[backdrop-filter]:${themeClasses.headerBg} sticky top-0 z-50 shadow-sm`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className={`${themeClasses.textSecondary} hover:text-cyan-600`}
              >
                <img src="/favicon.ico" alt="2LY Logo" className="h-6 w-6 mr-2" />
                <span className={`text-xl font-bold ${themeClasses.text}`}>2LY</span>
              </Button>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm">
              {/* Workspace Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`${themeClasses.textSecondary} hover:text-cyan-600 flex items-center space-x-1`}>
                    <Building2 className="h-4 w-4" />
                    <span>{selectedWorkspace}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => setSelectedWorkspace(workspace.name)}
                      className={`${themeClasses.text} hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} cursor-pointer`}
                    >
                      <div>
                        <div className="font-medium">{workspace.name}</div>
                        <div className={`text-xs ${themeClasses.textMuted}`}>{workspace.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ChevronRight className={`h-3 w-3 ${themeClasses.textMuted}`} />

              {/* User Name */}
              <span className={`${themeClasses.textSecondary} font-medium`}>{currentUser.name}</span>

              <ChevronRight className={`h-3 w-3 ${themeClasses.textMuted}`} />

              {/* Current Section */}
              <span className={`${themeClasses.text} font-medium`}>{getCurrentSectionLabel()}</span>

              {/* Current Subsection (if different from section) */}
              {getCurrentSubSectionLabel() && getCurrentSubSectionLabel() !== getCurrentSectionLabel() && (
                <>
                  <ChevronRight className={`h-3 w-3 ${themeClasses.textMuted}`} />
                  <span className={`${themeClasses.textSecondary}`}>{getCurrentSubSectionLabel()}</span>
                </>
              )}
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search agents, tools..."
                  className={`${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg pl-10 pr-4 py-2 text-sm ${themeClasses.inputText} ${themeClasses.inputPlaceholder} focus:border-cyan-500 focus:outline-none w-64`}
                />
              </div>
              <Button variant="ghost" size="sm" className={`${themeClasses.textSecondary} hover:text-cyan-600`}>
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className={`${themeClasses.textSecondary} hover:text-cyan-600`}>
                <User className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
                className={`${themeClasses.textSecondary} hover:text-cyan-600`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation Bar */}
      <nav className={`border-b ${themeClasses.headerBorder} ${themeClasses.navBg}`}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            {/* Main Navigation */}
            <div className="flex space-x-1">
              {topLevelSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant="ghost"
                    onClick={() => {
                      setActiveSection(section.id);
                      setActiveSubSection(subSections[section.id as keyof typeof subSections][0].id);
                    }}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? `text-cyan-600 border-b-2 border-cyan-600 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`
                        : `${themeClasses.textSecondary} hover:${themeClasses.text} ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-200/30'}`
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {section.label}
                  </Button>
                );
              })}
            </div>

            {/* Sub Navigation */}
            <div className="flex space-x-1">
              {subSections[activeSection as keyof typeof subSections]?.map((subSection) => (
                <Button
                  key={subSection.id}
                  variant="ghost"
                  onClick={() => setActiveSubSection(subSection.id)}
                  className={`px-3 py-2 text-xs transition-colors ${
                    activeSubSection === subSection.id
                      ? "text-cyan-600 bg-cyan-50"
                      : `${themeClasses.textMuted} hover:${themeClasses.textSecondary}`
                  }`}
                >
                  {subSection.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeSection === "tools" && activeSubSection === "catalog" && (
          <div className="space-y-6">
            {/* Tool Catalog Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Tool Catalog</h1>
                <p className={`${themeClasses.textSecondary} mt-1`}>Discover and integrate powerful tools for your AI agents</p>
              </div>
              <Button className="bg-cyan-600 text-white hover:bg-cyan-700">
                <Download className="h-4 w-4 mr-2" />
                Install Tool
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textMuted}`} />
                  <Input
                    placeholder="Search tools by name, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.inputText}`}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className={`w-48 ${themeClasses.inputBg} ${themeClasses.inputBorder}`}>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className={`${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
                    {toolCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className={themeClasses.text}>
                        {category.name} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={`w-40 ${themeClasses.inputBg} ${themeClasses.inputBorder}`}>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className={`${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
                    <SelectItem value="popular" className={themeClasses.text}>Most Popular</SelectItem>
                    <SelectItem value="rating" className={themeClasses.text}>Highest Rated</SelectItem>
                    <SelectItem value="recent" className={themeClasses.text}>Recently Updated</SelectItem>
                    <SelectItem value="name" className={themeClasses.text}>Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {toolCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`${
                    selectedCategory === category.id 
                      ? "bg-cyan-600 text-white hover:bg-cyan-700" 
                      : `${themeClasses.cardBorder} ${themeClasses.textSecondary} hover:${themeClasses.text}`
                  }`}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Card key={tool.id} className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm hover:shadow-md transition-shadow`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg">
                            <IconComponent className="h-6 w-6 text-cyan-600" />
                          </div>
                          <div>
                            <CardTitle className={`text-lg ${themeClasses.text}`}>{tool.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className={`text-xs ${themeClasses.textSecondary} ml-1`}>{tool.rating}</span>
                              </div>
                              <Badge variant="outline" className={`text-xs ${
                                tool.status === "active" ? "text-green-600 border-green-600" : "text-gray-500 border-gray-500"
                              }`}>
                                {tool.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className={`text-sm ${themeClasses.textSecondary} line-clamp-2`}>{tool.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tool.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tool.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Download className="h-3 w-3 mr-1" />
                            {tool.downloads.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(tool.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs">v{tool.version}</span>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700">
                          <Download className="h-3 w-3 mr-1" />
                          Install
                        </Button>
                        <Button size="sm" variant="outline" className={`${themeClasses.cardBorder}`}>
                          <BookOpen className="h-3 w-3 mr-1" />
                          Docs
                        </Button>
                        <Button size="sm" variant="outline" className={`${themeClasses.cardBorder}`}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {sortedTools.length === 0 && (
              <div className="text-center py-12">
                <div className={`${themeClasses.cardBg} p-8 rounded-lg border ${themeClasses.cardBorder} shadow-sm max-w-md mx-auto`}>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No tools found</h3>
                  <p className={`${themeClasses.textSecondary} mb-4`}>
                    Try adjusting your search terms or filters to find the tools you're looking for.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    variant="outline"
                    className={`${themeClasses.cardBorder}`}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "tools" && activeSubSection === "playground" && (
          <div className="space-y-6">
            {/* Playground Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Tool Playground</h1>
                <p className={`${themeClasses.textSecondary} mt-1`}>Test and interact with tools in a safe environment</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setChatMessages([{ id: 1, type: "system", content: "Playground reset. Select a tool and start fresh!", timestamp: new Date() }]);
                    setConsoleOutput([
                      { id: 1, type: "info", content: "2LY Playground Console reset", timestamp: new Date() },
                      { id: 2, type: "info", content: "Ready for tool execution", timestamp: new Date() }
                    ]);
                  }}
                  className={`${themeClasses.cardBorder} ${themeClasses.textSecondary}`}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button className="bg-cyan-600 text-white hover:bg-cyan-700">
                  <Code className="h-4 w-4 mr-2" />
                  Export Code
                </Button>
              </div>
            </div>

            {/* Tool Selection */}
            <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
              <CardHeader>
                <CardTitle className={`text-lg ${themeClasses.text}`}>Select Tool</CardTitle>
                <CardDescription className={themeClasses.textSecondary}>
                  Choose a tool to interact with in the playground
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger className={`${themeClasses.inputBg} ${themeClasses.inputBorder}`}>
                    <SelectValue placeholder="Choose a tool to test..." />
                  </SelectTrigger>
                  <SelectContent className={`${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
                    {mockTools.map((tool) => {
                      const IconComponent = tool.icon;
                      return (
                        <SelectItem key={tool.id} value={tool.id} className={themeClasses.text}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4 text-cyan-600" />
                            <span>{tool.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedTool && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Interface */}
                <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${themeClasses.text} flex items-center`}>
                      <MessageSquare className="h-5 w-5 mr-2 text-cyan-600" />
                      Chat Interface
                    </CardTitle>
                    <CardDescription className={themeClasses.textSecondary}>
                      Interact with {mockTools.find(t => t.id === selectedTool)?.name} using natural language
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chat Messages */}
                    <div className={`h-64 overflow-y-auto ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder} p-4 space-y-3`}>
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-cyan-600 text-white' 
                              : message.type === 'system'
                              ? `${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${themeClasses.textSecondary}`
                              : `${themeClasses.cardBg} ${themeClasses.cardBorder} border ${themeClasses.text}`
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.type === 'user' ? 'text-cyan-100' : themeClasses.textMuted
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isExecuting && (
                        <div className="flex justify-start">
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${themeClasses.cardBg} ${themeClasses.cardBorder} border ${themeClasses.text}`}>
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-600"></div>
                              <p className="text-sm">Executing...</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your request..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isExecuting}
                        className={`flex-1 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.inputText}`}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isExecuting}
                        className="bg-cyan-600 text-white hover:bg-cyan-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Console Output */}
                <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg ${themeClasses.text} flex items-center`}>
                        <Terminal className="h-5 w-5 mr-2 text-green-600" />
                        Console Output
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                          className={themeClasses.textSecondary}
                        >
                          {isConsoleExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setConsoleOutput([
                            { id: 1, type: "info", content: "Console cleared", timestamp: new Date() }
                          ])}
                          className={themeClasses.textSecondary}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className={themeClasses.textSecondary}>
                      Real-time execution logs and code output
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`${isConsoleExpanded ? 'h-96' : 'h-64'} overflow-y-auto bg-black text-green-400 rounded-lg p-4 font-mono text-sm space-y-1`}>
                      {consoleOutput.map((log) => (
                        <div key={log.id} className="flex items-start space-x-2">
                          <span className="text-gray-500 text-xs min-w-0 flex-shrink-0">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={`text-xs ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'code' ? 'text-blue-400' :
                            'text-gray-300'
                          }`}>
                            [{log.type.toUpperCase()}]
                          </span>
                          <pre className={`text-xs flex-1 whitespace-pre-wrap ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'code' ? 'text-blue-400' :
                            'text-gray-300'
                          }`}>
                            {log.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!selectedTool && (
              <div className="text-center py-12">
                <div className={`${themeClasses.cardBg} p-8 rounded-lg border ${themeClasses.cardBorder} shadow-sm max-w-md mx-auto`}>
                  <Code className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>Select a Tool to Start</h3>
                  <p className={`${themeClasses.textSecondary} mb-4`}>
                    Choose a tool from the dropdown above to begin testing and interacting with it in the playground.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Dashboard Overview</h1>
                <p className={`${themeClasses.textSecondary} mt-1`}>Monitor your AI agents and tools in real-time</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  className="bg-cyan-600 text-white hover:bg-cyan-700"
                  onClick={() => setShowDeploymentModal(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Deploy Agent
                </Button>
                <Button variant="outline" className={`${themeClasses.cardBorder} ${themeClasses.textSecondary} ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>Active Agents</CardTitle>
                    <Bot className="h-4 w-4 text-cyan-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>{stats.totalAgents}</div>
                  <p className="text-xs text-green-600 mt-1">+2 this week</p>
                </CardContent>
              </Card>

              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>Connected Tools</CardTitle>
                    <Wrench className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>{stats.activeTools}</div>
                  <p className="text-xs text-green-600 mt-1">+5 this week</p>
                </CardContent>
              </Card>

              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>Total Calls</CardTitle>
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>{stats.totalCalls.toLocaleString()}</div>
                  <p className="text-xs text-green-600 mt-1">+12% today</p>
                </CardContent>
              </Card>

              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>{stats.successRate}%</div>
                  <Progress value={stats.successRate} className="mt-2 h-1" />
                </CardContent>
              </Card>

              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>Avg Response</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>{stats.avgResponseTime}ms</div>
                  <p className="text-xs text-green-600 mt-1">-15ms today</p>
                </CardContent>
              </Card>

              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>Cost Savings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>{stats.costSavings}%</div>
                  <p className="text-xs text-green-600 mt-1">vs last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Activity Chart */}
              <Card className={`lg:col-span-2 ${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader>
                  <CardTitle className={themeClasses.text}>Agent Activity</CardTitle>
                  <CardDescription className={themeClasses.textSecondary}>
                    Real-time tool execution monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`h-64 ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder} flex items-center justify-center`}>
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                      <p className={themeClasses.textSecondary}>Interactive chart showing agent activity over time</p>
                      <p className={`text-sm ${themeClasses.textMuted} mt-2`}>Real-time data visualization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                <CardHeader>
                  <CardTitle className={themeClasses.text}>Recent Activity</CardTitle>
                  <CardDescription className={themeClasses.textSecondary}>
                    Latest tool executions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const StatusIcon = getStatusIcon(activity.status);
                      return (
                        <div key={activity.id} className={`flex items-center space-x-3 p-3 ${themeClasses.activityBg} rounded-lg`}>
                          <StatusIcon className={`h-4 w-4 ${getStatusColor(activity.status)}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${themeClasses.text} truncate`}>
                              {activity.agent}
                            </p>
                            <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                              {activity.tool}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs ${themeClasses.textSecondary}`}>{activity.time}</p>
                            <p className={`text-xs ${themeClasses.textMuted}`}>{activity.duration}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tool Relationships Map */}
            <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
              <CardHeader>
                <CardTitle className={themeClasses.text}>Agent-Tool Relationship Map</CardTitle>
                <CardDescription className={themeClasses.textSecondary}>
                  Visual representation of your AI ecosystem dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`h-96 ${themeClasses.chartBg} rounded-lg border ${themeClasses.chartBorder} flex items-center justify-center`}>
                  <div className="text-center">
                    <Network className="h-16 w-16 text-cyan-600 mx-auto mb-4" />
                    <p className={`${themeClasses.textSecondary} text-lg mb-2`}>Interactive Relationship Graph</p>
                    <p className={`text-sm ${themeClasses.textMuted} max-w-md`}>
                      Visualize how your agents connect to tools, track dependencies, 
                      and identify optimization opportunities in your AI workflow.
                    </p>
                    <Button className="mt-4 bg-cyan-600 text-white hover:bg-cyan-700">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Explore Relationships
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "agents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text}`}>AI Agents</h1>
                <p className={`${themeClasses.textSecondary} mt-1`}>Manage and monitor your AI agents</p>
              </div>
              <Button 
                className="bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={() => setShowDeploymentModal(true)}
              >
                <Bot className="h-4 w-4 mr-2" />
                Deploy New Agent
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "DataAnalyzer", status: "active", tools: 8, calls: 1247, uptime: "99.8%" },
                { name: "ContentWriter", status: "active", tools: 5, calls: 892, uptime: "99.2%" },
                { name: "WebScraper", status: "warning", tools: 12, calls: 634, uptime: "97.1%" },
                { name: "EmailProcessor", status: "active", tools: 3, calls: 2156, uptime: "99.9%" },
                { name: "ImageGenerator", status: "error", tools: 4, calls: 156, uptime: "85.2%" },
                { name: "ChatBot", status: "active", tools: 7, calls: 3421, uptime: "99.5%" }
              ].map((agent, index) => (
                <Card key={index} className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-sm`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={themeClasses.text}>{agent.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`${
                          agent.status === "active" ? "text-green-600 border-green-600" :
                          agent.status === "warning" ? "text-yellow-600 border-yellow-600" :
                          "text-red-600 border-red-600"
                        }`}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={themeClasses.textSecondary}>Connected Tools</span>
                        <span className={themeClasses.text}>{agent.tools}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={themeClasses.textSecondary}>Total Calls</span>
                        <span className={themeClasses.text}>{agent.calls.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={themeClasses.textSecondary}>Uptime</span>
                        <span className={themeClasses.text}>{agent.uptime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Add more sections as needed */}
        {activeSection !== "overview" && activeSection !== "agents" && activeSection !== "tools" && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className={`${themeClasses.cardBg} p-8 rounded-lg border ${themeClasses.cardBorder} shadow-sm max-w-md mx-auto`}>
                <Terminal className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                <h2 className={`text-xl font-bold ${themeClasses.text} mb-2`}>
                  {topLevelSections.find(s => s.id === activeSection)?.label} Section
                </h2>
                <p className={`${themeClasses.textSecondary} mb-4`}>
                  This section is under development. Coming soon with advanced {activeSection} features.
                </p>
                <Badge variant="outline" className="text-cyan-600 border-cyan-600">
                  Coming Soon
                </Badge>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Agent Deployment Modal */}
      <AgentDeploymentModal
        open={showDeploymentModal}
        onOpenChange={setShowDeploymentModal}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default Dashboard;
import type { MockMCPTool } from './types';

// Mock MCP tools for different capabilities
export const mockTools: Record<string, MockMCPTool[]> = {
  todoList: [
    {
      id: 'tool-1',
      name: 'create_task',
      description: 'Create a new task in the todo list',
      mcpServerName: 'todo-server',
      category: 'input',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The task title' },
          description: { type: 'string', description: 'Optional task description' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          dueDate: { type: 'string', format: 'date' },
        },
        required: ['title'],
      },
    },
    {
      id: 'tool-2',
      name: 'list_tasks',
      description: 'List all tasks in the todo list',
      mcpServerName: 'todo-server',
      category: 'output',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'all'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    {
      id: 'tool-3',
      name: 'complete_task',
      description: 'Mark a task as completed',
      mcpServerName: 'todo-server',
      category: 'processing',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'The ID of the task to complete' },
        },
        required: ['taskId'],
      },
    },
    {
      id: 'tool-4',
      name: 'delete_task',
      description: 'Delete a task from the todo list',
      mcpServerName: 'todo-server',
      category: 'processing',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'The ID of the task to delete' },
        },
        required: ['taskId'],
      },
    },
  ],
  documentation: [
    {
      id: 'tool-5',
      name: 'search_docs',
      description: 'Search through documentation using semantic search',
      mcpServerName: 'docs-server',
      category: 'input',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          maxResults: { type: 'number', description: 'Maximum number of results to return', default: 10 },
        },
        required: ['query'],
      },
    },
    {
      id: 'tool-6',
      name: 'get_document',
      description: 'Retrieve a specific document by ID or path',
      mcpServerName: 'docs-server',
      category: 'input',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'The document ID or path' },
        },
        required: ['documentId'],
      },
    },
    {
      id: 'tool-7',
      name: 'list_categories',
      description: 'List all documentation categories',
      mcpServerName: 'docs-server',
      category: 'output',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      id: 'tool-8',
      name: 'get_related_docs',
      description: 'Get documents related to a specific topic',
      mcpServerName: 'docs-server',
      category: 'processing',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'The reference document ID' },
          limit: { type: 'number', description: 'Maximum number of related docs', default: 5 },
        },
        required: ['documentId'],
      },
    },
  ],
  reddit: [
    {
      id: 'tool-9',
      name: 'get_hot_posts',
      description: 'Get hot posts from specified subreddits',
      mcpServerName: 'reddit-server',
      category: 'input',
      inputSchema: {
        type: 'object',
        properties: {
          subreddits: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of subreddit names',
          },
          limit: { type: 'number', description: 'Number of posts per subreddit', default: 10 },
        },
        required: ['subreddits'],
      },
    },
    {
      id: 'tool-10',
      name: 'get_top_posts',
      description: 'Get top posts from specified subreddits',
      mcpServerName: 'reddit-server',
      category: 'input',
      inputSchema: {
        type: 'object',
        properties: {
          subreddits: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of subreddit names',
          },
          timeRange: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month', 'year', 'all'],
            description: 'Time range for top posts',
          },
          limit: { type: 'number', description: 'Number of posts per subreddit', default: 10 },
        },
        required: ['subreddits', 'timeRange'],
      },
    },
    {
      id: 'tool-11',
      name: 'search_reddit',
      description: 'Search Reddit for posts matching a query',
      mcpServerName: 'reddit-server',
      category: 'processing',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          subreddit: { type: 'string', description: 'Optional subreddit to search within' },
          sort: { type: 'string', enum: ['relevance', 'hot', 'top', 'new'] },
          limit: { type: 'number', description: 'Number of results', default: 25 },
        },
        required: ['query'],
      },
    },
    {
      id: 'tool-12',
      name: 'get_post_comments',
      description: 'Get comments from a specific Reddit post',
      mcpServerName: 'reddit-server',
      category: 'output',
      inputSchema: {
        type: 'object',
        properties: {
          postId: { type: 'string', description: 'Reddit post ID' },
          limit: { type: 'number', description: 'Number of comments', default: 100 },
          sort: { type: 'string', enum: ['best', 'top', 'new', 'controversial', 'old'] },
        },
        required: ['postId'],
      },
    },
  ],
};

// Additional tools for composition demonstration
const additionalTools: MockMCPTool[] = [
  {
    id: 'tool-13',
    name: 'send_notification',
    description: 'Send a notification to a user or channel',
    mcpServerName: 'notification-server',
    category: 'output',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Notification message' },
        channel: { type: 'string', description: 'Target channel or user' },
      },
      required: ['message'],
    },
  },
  {
    id: 'tool-14',
    name: 'analyze_text',
    description: 'Analyze text for sentiment, keywords, and entities',
    mcpServerName: 'nlp-server',
    category: 'processing',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
        analysisType: { type: 'string', enum: ['sentiment', 'keywords', 'entities', 'all'] },
      },
      required: ['text'],
    },
  },
  {
    id: 'tool-15',
    name: 'format_output',
    description: 'Format data into various output formats',
    mcpServerName: 'formatter-server',
    category: 'output',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', description: 'Data to format' },
        format: { type: 'string', enum: ['json', 'markdown', 'html', 'csv'] },
      },
      required: ['data', 'format'],
    },
  },
  {
    id: 'tool-16',
    name: 'read_file',
    description: 'Read contents from a file',
    mcpServerName: 'filesystem-server',
    category: 'input',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    id: 'tool-17',
    name: 'write_file',
    description: 'Write content to a file',
    mcpServerName: 'filesystem-server',
    category: 'output',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    id: 'tool-18',
    name: 'filter_data',
    description: 'Filter data based on criteria',
    mcpServerName: 'data-server',
    category: 'processing',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array', description: 'Data array to filter' },
        criteria: { type: 'object', description: 'Filter criteria' },
      },
      required: ['data', 'criteria'],
    },
  },
];

// Export all available tools for the tool picker
export const allAvailableTools: MockMCPTool[] = [
  ...mockTools.todoList,
  ...mockTools.documentation,
  ...mockTools.reddit,
  ...additionalTools,
];

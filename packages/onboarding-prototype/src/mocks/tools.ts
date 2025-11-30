import type { MockMCPTool } from './types';

// Mock MCP tools for different capabilities
export const mockTools: Record<string, MockMCPTool[]> = {
  todoList: [
    {
      id: 'tool-1',
      name: 'create_task',
      description: 'Create a new task in the todo list',
      mcpServerName: 'todo-server',
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

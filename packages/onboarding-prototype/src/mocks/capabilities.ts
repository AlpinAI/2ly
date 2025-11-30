import type { Capability } from './types';
import { mockTools } from './tools';

export const capabilities: Capability[] = [
  {
    id: 'todo-list',
    name: 'Todo List Manager',
    description: 'Manage your tasks with AI assistance. Create, organize, and track your todos using natural language.',
    icon: 'CheckSquare',
    toolsetPreset: {
      id: 'toolset-todo',
      name: 'Todo Management',
      description: 'Tools for managing todo lists and tasks',
      mcpTools: mockTools.todoList,
    },
  },
  {
    id: 'documentation',
    name: 'Documentation Search',
    description: 'Search and navigate your documentation using semantic search. Get instant answers from your knowledge base.',
    icon: 'BookOpen',
    toolsetPreset: {
      id: 'toolset-docs',
      name: 'Documentation Tools',
      description: 'Tools for searching and retrieving documentation',
      mcpTools: mockTools.documentation,
    },
  },
  {
    id: 'reddit',
    name: 'Reddit Catch-up',
    description: 'Stay updated with your favorite subreddits. Get summaries of hot posts, trending topics, and discussions.',
    icon: 'MessageCircle',
    toolsetPreset: {
      id: 'toolset-reddit',
      name: 'Reddit Integration',
      description: 'Tools for browsing and searching Reddit',
      mcpTools: mockTools.reddit,
    },
  },
];

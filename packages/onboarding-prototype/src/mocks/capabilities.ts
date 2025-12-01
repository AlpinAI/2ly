import type { Capability } from './types';
import { mockTools } from './tools';

export const capabilities: Capability[] = [
  {
    id: 'todo-list',
    name: 'Task Management Skill',
    description: 'Teach your agent how to manage tasks and todos. Your agent learns task workflows, priorities, and organizational strategies.',
    icon: 'CheckSquare',
    exampleActions: [
      'Add "review PR #123" to my todo list',
      'What tasks do I have due this week?',
      'Mark the deployment task as complete',
      'Create a high-priority task for the team meeting',
    ],
    agentPrompt: 'Your agent learns to organize and track tasks using structured workflows.',
    skill: {
      id: 'skill-task-mgmt',
      name: 'Task Management',
      description: 'Manage tasks and todos with AI assistance',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Access to your task database and productivity context',
        sources: [
          {
            type: 'rag',
            name: 'Task Management Best Practices',
            description: 'Productivity methodologies, GTD principles, prioritization frameworks',
          },
          {
            type: 'files',
            name: 'Your Productivity System',
            description: 'Personal task templates, project structures, workflow preferences',
          },
        ],
      },
      instructions: {
        scope: 'Use this skill for creating, organizing, and tracking personal or team tasks. Applies to todo lists, project management, and deadline tracking.',
        guardrails: [
          'Only manage tasks that belong to the current user or their teams',
          'Always confirm before deleting tasks or marking important items complete',
          'Respect priority levels - don\'t auto-change user-set priorities',
          'Preserve task history and completion dates for accountability',
        ],
      },
      tools: mockTools.todoList,
      exampleTasks: [
        'Add "review PR #123" to my todo list',
        'What tasks do I have due this week?',
        'Mark the deployment task as complete',
        'Create a high-priority task for the team meeting',
      ],
    },
    toolsetPreset: {
      id: 'toolset-todo',
      name: 'Task Management Actions',
      description: 'Tools for creating, reading, updating, and managing tasks',
      mcpTools: mockTools.todoList,
    },
  },
  {
    id: 'documentation',
    name: 'Knowledge Research Skill',
    description: 'Teach your agent how to search and retrieve information from documentation. Your agent learns semantic search and knowledge synthesis.',
    icon: 'BookOpen',
    exampleActions: [
      'Where did we document the authentication flow?',
      'Find all docs related to the payment system',
      'What does the API reference say about rate limits?',
      'Show me documentation about deployment',
    ],
    agentPrompt: 'Your agent learns to navigate, search, and synthesize knowledge from documentation.',
    skill: {
      id: 'skill-docs-research',
      name: 'Knowledge Research',
      description: 'Search and retrieve information from documentation',
      icon: 'BookOpen',
      knowledge: {
        description: 'Your documentation, wikis, and knowledge bases',
        sources: [
          {
            type: 'rag',
            name: 'Company Documentation',
            description: 'Technical docs, API references, internal wikis, architecture diagrams',
          },
          {
            type: 'files',
            name: 'Knowledge Base Articles',
            description: 'FAQs, troubleshooting guides, how-to documentation',
          },
        ],
      },
      instructions: {
        scope: 'Use this skill for finding information in documentation, answering technical questions, and navigating knowledge bases. Best for "where is X documented" or "how do I do Y" questions.',
        guardrails: [
          'Only search within authorized documentation sources',
          'Always cite sources when providing information',
          'If information is not found, say so - don\'t make up answers',
          'For sensitive topics, direct users to official documentation',
        ],
      },
      tools: mockTools.documentation,
      exampleTasks: [
        'Where did we document the authentication flow?',
        'Find all docs related to the payment system',
        'What does the API reference say about rate limits?',
        'Show me documentation about deployment',
      ],
    },
    toolsetPreset: {
      id: 'toolset-docs',
      name: 'Documentation Research Actions',
      description: 'Tools for searching, retrieving, and analyzing documentation',
      mcpTools: mockTools.documentation,
    },
  },
  {
    id: 'reddit',
    name: 'Social Media Research Skill',
    description: 'Teach your agent how to monitor and analyze Reddit. Your agent learns to browse communities, identify trends, and curate content.',
    icon: 'MessageCircle',
    exampleActions: [
      'What are the hot topics in r/programming today?',
      'Summarize top posts from r/MachineLearning this week',
      'Find discussions about the new framework release',
      'Get me the best comments from that viral thread',
    ],
    agentPrompt: 'Your agent learns to navigate Reddit communities, analyze trends, and curate relevant content.',
    skill: {
      id: 'skill-reddit-research',
      name: 'Social Media Research',
      description: 'Monitor and analyze Reddit communities',
      icon: 'MessageCircle',
      knowledge: {
        description: 'Reddit data, community context, and trending topics',
        sources: [
          {
            type: 'rag',
            name: 'Subreddit Context',
            description: 'Community rules, culture, common topics, key contributors',
          },
          {
            type: 'files',
            name: 'Topic Tracking Lists',
            description: 'Your followed subreddits, saved posts, interest keywords',
          },
        ],
      },
      instructions: {
        scope: 'Use this skill for monitoring Reddit communities, tracking discussions, and finding trending content. Best for staying updated on specific topics or communities.',
        guardrails: [
          'Only access public subreddits and posts',
          'Respect community guidelines and Reddit API limits',
          'Summarize objectively without injecting bias',
          'Don\'t participate in discussions or vote on behalf of user',
        ],
      },
      tools: mockTools.reddit,
      exampleTasks: [
        'What are the hot topics in r/programming today?',
        'Summarize top posts from r/MachineLearning this week',
        'Find discussions about the new framework release',
        'Get me the best comments from that viral thread',
      ],
    },
    toolsetPreset: {
      id: 'toolset-reddit',
      name: 'Reddit Research Actions',
      description: 'Tools for browsing subreddits, searching posts, and analyzing discussions',
      mcpTools: mockTools.reddit,
    },
  },
];

import type { ChatMessage } from './types';

export const mockChatMessages: Record<string, ChatMessage[]> = {
  todoList: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello! I can help you manage your todo list. What would you like to do?',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'Show me all my pending tasks',
      timestamp: new Date(Date.now() - 90000),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: 'I will retrieve your pending tasks.',
      timestamp: new Date(Date.now() - 85000),
      toolCalls: [
        {
          toolName: 'list_tasks',
          status: 'success',
        },
      ],
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: 'You have 3 pending tasks:\n\n1. Review pull request #42 (High priority)\n2. Update documentation for API changes (Medium priority)\n3. Schedule team meeting (Low priority)\n\nWould you like me to help you with any of these?',
      timestamp: new Date(Date.now() - 80000),
    },
    {
      id: 'msg-5',
      role: 'user',
      content: 'Create a new task to fix the login bug, high priority',
      timestamp: new Date(Date.now() - 40000),
    },
    {
      id: 'msg-6',
      role: 'assistant',
      content: 'I will create that task for you.',
      timestamp: new Date(Date.now() - 35000),
      toolCalls: [
        {
          toolName: 'create_task',
          status: 'success',
        },
      ],
    },
    {
      id: 'msg-7',
      role: 'assistant',
      content: 'I have created a new high-priority task: "Fix the login bug". Is there anything else you would like to add to your todo list?',
      timestamp: new Date(Date.now() - 30000),
    },
  ],
  documentation: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hi! I can help you search and navigate your documentation. What are you looking for?',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'How do I implement authentication in the API?',
      timestamp: new Date(Date.now() - 90000),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: 'Let me search the documentation for authentication implementation.',
      timestamp: new Date(Date.now() - 85000),
      toolCalls: [
        {
          toolName: 'search_docs',
          status: 'success',
        },
      ],
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: 'I found several relevant documents:\n\n1. **Authentication Guide** - Complete guide to implementing JWT authentication\n2. **API Security Best Practices** - Security recommendations including auth patterns\n3. **OAuth Integration** - How to integrate OAuth providers\n\nWould you like me to retrieve any of these documents for you?',
      timestamp: new Date(Date.now() - 80000),
    },
    {
      id: 'msg-5',
      role: 'user',
      content: 'Yes, show me the Authentication Guide',
      timestamp: new Date(Date.now() - 40000),
    },
    {
      id: 'msg-6',
      role: 'assistant',
      content: 'Retrieving the Authentication Guide...',
      timestamp: new Date(Date.now() - 35000),
      toolCalls: [
        {
          toolName: 'get_document',
          status: 'success',
        },
      ],
    },
    {
      id: 'msg-7',
      role: 'assistant',
      content: 'Here is the Authentication Guide:\n\n**JWT Authentication Implementation**\n\n1. Install required packages: `npm install jsonwebtoken bcrypt`\n2. Create a secret key for signing tokens\n3. Implement login endpoint that verifies credentials and returns JWT\n4. Add middleware to verify JWT on protected routes\n\nWould you like me to find related documents or provide more details on any step?',
      timestamp: new Date(Date.now() - 30000),
    },
  ],
  reddit: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello! I can help you stay updated with Reddit. Which subreddits would you like to follow?',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'What are the hot posts in r/programming and r/javascript?',
      timestamp: new Date(Date.now() - 90000),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: 'Let me fetch the hot posts from those subreddits.',
      timestamp: new Date(Date.now() - 85000),
      toolCalls: [
        {
          toolName: 'get_hot_posts',
          status: 'success',
        },
      ],
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: 'Here are the top hot posts:\n\n**r/programming:**\n1. "The future of WebAssembly" (523 upvotes)\n2. "Why I switched from VSCode to Neovim" (412 upvotes)\n3. "Building a compiler in Rust" (389 upvotes)\n\n**r/javascript:**\n1. "React 19 Released" (891 upvotes)\n2. "Understanding JavaScript Closures" (567 upvotes)\n3. "TypeScript 5.5 Beta Features" (445 upvotes)\n\nWould you like to see comments from any of these posts?',
      timestamp: new Date(Date.now() - 80000),
    },
    {
      id: 'msg-5',
      role: 'user',
      content: 'Show me the comments on the React 19 post',
      timestamp: new Date(Date.now() - 40000),
    },
    {
      id: 'msg-6',
      role: 'assistant',
      content: 'Fetching comments...',
      timestamp: new Date(Date.now() - 35000),
      toolCalls: [
        {
          toolName: 'get_post_comments',
          status: 'success',
        },
      ],
    },
    {
      id: 'msg-7',
      role: 'assistant',
      content: 'Top comments on "React 19 Released":\n\n1. "Finally! The new use() hook is game-changing" (234 upvotes)\n2. "Breaking changes are minimal, upgrade was smooth" (189 upvotes)\n3. "Server Components are production-ready now" (156 upvotes)\n\nAnything else you would like to know?',
      timestamp: new Date(Date.now() - 30000),
    },
  ],
};

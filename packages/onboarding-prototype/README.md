# 2ly Onboarding Prototype

A capability-driven wizard flow prototype for onboarding new users to 2ly. This standalone application demonstrates the user experience of selecting capabilities, reviewing pre-configured toolsets, and choosing between embedded chat or connection instructions.

## Overview

This prototype runs independently from the main 2ly application on port 8889 and uses mock data to demonstrate the onboarding flow without requiring backend services.

## Features

- **Step 1: Capability Selection** - Choose from predefined capabilities (Todo List Manager, Documentation Search, Reddit Catch-up)
- **Step 2: Toolset Preview** - Review pre-configured MCP tools for the selected capability
- **Step 3: Interaction Options** - Choose between:
  - Embedded chat with mock conversation examples
  - Connection instructions for integrating with AI agents
- **Wizard State Persistence** - Progress is saved to localStorage
- **Responsive UI** - Built with Radix UI and Tailwind CSS

## Quick Start

### Install Dependencies

From the repository root:

```bash
npm install
```

### Run the Prototype

```bash
npm run dev:onboarding-prototype
```

The prototype will be available at: http://localhost:8889

## Architecture

### Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI primitives

### Project Structure

```
packages/onboarding-prototype/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx           # Reusable Button component
│   │   ├── CapabilitySelector.tsx   # Step 1: Choose capability
│   │   ├── ToolsetPreview.tsx       # Step 2: Review toolset
│   │   ├── InteractionOptions.tsx   # Step 3: Choose experience
│   │   ├── EmbeddedChatMock.tsx     # Mock chat interface
│   │   └── ConnectionInstructions.tsx # MCP connection guide
│   ├── mocks/
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── capabilities.ts          # Capability definitions
│   │   ├── tools.ts                 # Mock MCP tool data
│   │   └── chat.ts                  # Mock chat messages
│   ├── lib/
│   │   └── utils.ts                 # Utility functions (cn)
│   ├── App.tsx                      # Main wizard component
│   ├── main.tsx                     # Application entry point
│   └── index.css                    # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Mock Data Structure

### Capabilities

Each capability includes:
- Unique ID
- Name and description
- Icon identifier
- Pre-configured toolset with MCP tools

Available capabilities:
1. **Todo List Manager** - Task management with 4 tools
2. **Documentation Search** - Semantic search with 4 tools
3. **Reddit Catch-up** - Subreddit browsing with 4 tools

### MCP Tools

Mock tools match the GraphQL schema structure:
```typescript
interface MockMCPTool {
  id: string;
  name: string;
  description?: string;
  mcpServerName: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}
```

### Chat Messages

Each capability has pre-loaded conversation examples demonstrating:
- Natural language interaction
- Tool calls with success indicators
- Multi-turn conversations

## Key Features

### Wizard Navigation

- Three-step flow with progress indicator
- Back navigation support
- Step completion tracking
- State persistence via localStorage

### Component Reuse

The prototype reuses UI components from the main frontend:
- Button component (Radix UI with variants)
- Tailwind design system
- cn() utility for class merging
- Consistent styling patterns

### Mock Data Matching GraphQL Types

All mock data structures align with the existing GraphQL schema to ensure the prototype can be easily integrated with real data in the future.

## Development

### Adding New Capabilities

1. Add MCP tools to `src/mocks/tools.ts`
2. Define capability in `src/mocks/capabilities.ts`
3. Add mock chat messages to `src/mocks/chat.ts`
4. Update icon mapping in `CapabilitySelector.tsx` if needed

### Modifying Wizard Steps

The wizard flow is managed in `App.tsx`:
- Add new steps to the `WizardStep` type
- Update state management
- Create new step components
- Update progress indicator

### Styling

The prototype uses the same design system as the main frontend:
- CSS custom properties for theming
- Tailwind utility classes
- Consistent color palette (cyan brand color)
- Dark mode support (via `.dark` class)

## Integration with Main App

When ready to integrate with the main 2ly application:

1. Replace mock data with GraphQL queries
2. Connect to backend for real MCP server data
3. Implement actual chat functionality (if needed)
4. Add authentication flow
5. Update connection instructions with real workspace data

## Testing

This is a prototype without automated tests. For manual testing:

1. Test all three capabilities
2. Navigate through all wizard steps
3. Test back navigation
4. Verify state persistence (refresh page)
5. Test both interaction options (chat and connect)
6. Verify responsive layout

## Port Configuration

- **Development Port**: 8889
- **Main Frontend**: 8888 (no conflict)
- **Backend**: 3000 (not required for prototype)

## Notes

- This is an **isolated prototype** with no backend dependencies
- All data is **mocked** and stored in the codebase
- State persists in browser **localStorage**
- The prototype demonstrates **UX flow only**, not production functionality

## Future Enhancements

Potential improvements for production version:

1. Add animation transitions between steps
2. Implement keyboard navigation
3. Add accessibility improvements (ARIA labels)
4. Create mobile-optimized layouts
5. Add analytics tracking for user flow
6. Implement A/B testing for different flows
7. Add tooltips and help text
8. Create admin panel to customize capabilities

## License

Part of the 2ly project.

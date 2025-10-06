# 2LY Frontend v2

Modern, production-ready frontend for the 2LY AI Tool Management Platform built with React 19, TypeScript, and Tailwind CSS.

## 🏗️ Architecture Overview

This is a complete rewrite of the original frontend (`/packages/frontend`), designed with scalability, maintainability, and modern best practices in mind.

### Tech Stack

- **React 19.2** - Latest React with improved concurrent features and performance
- **React Router 7** - Client-side routing with modern data loading patterns
- **TypeScript** - Full type safety across the application
- **Tailwind CSS** - Utility-first CSS with design system integration
- **Radix UI** - Unstyled, accessible UI primitives
- **Vite** - Lightning-fast build tool and dev server
- **Apollo Client 3.14** - GraphQL client with normalized caching, subscriptions, and React 19 support
- **Zustand** - Lightweight state management for client state
- **GraphQL Code Generator** - Auto-generate TypeScript types and React hooks

### Design Philosophy

1. **Design System First**: All styles derive from a centralized design system defined in `src/index.css`
2. **Component Composition**: Radix UI primitives + Tailwind for consistent, accessible components
3. **Type Safety**: Strict TypeScript with no `any` types
4. **Monospace Aesthetic**: Following the inspiration design with `font-mono` throughout
5. **Dark Mode Native**: Theme switching built into the foundation, not bolted on

## 📁 Project Structure

```
frontend2/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── ThemeToggle.tsx
│   ├── contexts/         # React contexts for system state
│   │   └── ThemeContext.tsx
│   ├── stores/           # Zustand stores for client state
│   │   ├── uiStore.ts
│   │   └── workspaceStore.ts
│   ├── hooks/            # Custom React hooks
│   │   ├── useRuntimes.ts
│   │   └── useToolCatalog.ts
│   ├── lib/              # Utility functions and helpers
│   │   ├── utils.ts      # cn() for class merging
│   │   └── apollo/       # Apollo Client configuration
│   │       ├── client.ts
│   │       ├── links.ts
│   │       └── ApolloProvider.tsx
│   ├── graphql/          # GraphQL operations and generated types
│   │   ├── queries/      # GraphQL query files
│   │   ├── mutations/    # GraphQL mutation files
│   │   ├── subscriptions/ # GraphQL subscription files
│   │   └── generated/    # Auto-generated types & hooks
│   ├── pages/            # Route components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx
│   ├── App.tsx           # Root component with providers
│   ├── main.tsx          # React entry point
│   └── index.css         # Design system & global styles
├── .vscode/              # VSCode configuration
│   ├── extensions.json   # Recommended extensions
│   └── settings.json     # Tailwind IntelliSense config
├── codegen.ts            # GraphQL Code Generator config
├── package.json
├── vite.config.ts
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json
└── README.md
```

## 🎨 Design System

### Color System

Our design system uses **CSS custom properties (variables)** for theming, defined in `src/index.css`:

```css
:root {
  --primary: 186 100% 42%;    /* Cyan #06b6d4 */
  --background: 0 0% 100%;    /* White */
  --foreground: 222.2 84% 4.9%; /* Near black */
  /* ... more tokens */
}
```

**Why HSL format?**
- HSL values are stored WITHOUT the `hsl()` wrapper
- This allows Tailwind to apply opacity: `bg-primary/50` = primary at 50% opacity
- Format: `"hue saturation% lightness%"`

**Why semantic naming?**
- Colors are named by purpose (primary, muted) not appearance (blue, gray)
- Enables theme changes without touching component code
- Example: `--primary` is cyan in both light and dark modes

### Theme System

**Architecture:**
- ThemeContext (`src/contexts/ThemeContext.tsx`) manages theme state
- Applies `.dark` class to `<html>` element when dark mode is active
- CSS variables in `.dark` selector override light theme values
- Persisted to localStorage for user preference memory
- Respects system preference (`prefers-color-scheme`) as default

**Usage:**
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme} mode</button>;
}
```

### Typography

- **Font Family**: Monospace (`font-mono`)
- **Why**: Matches the technical, developer-focused aesthetic from the inspiration design

## 🧩 Key Components & Utilities

### `cn()` - Class Name Utility

Located in `src/lib/utils.ts`, this is critical for component development:

```tsx
import { cn } from '@/lib/utils';

function Button({ className }) {
  return (
    <button className={cn(
      'base-class',           // Base styles
      'hover:bg-blue-500',    // Conditional
      className               // User overrides
    )}>
      Click me
    </button>
  );
}
```

**Why it exists:**
- Combines `clsx` (conditional classes) + `tailwind-merge` (conflict resolution)
- Prevents Tailwind class conflicts (e.g., `p-4 p-2` becomes just `p-2`)
- Standard pattern in Tailwind/shadcn ecosystem

### ThemeContext

Centralized theme management to avoid prop drilling:

**Features:**
- ✅ Light/Dark mode toggle
- ✅ localStorage persistence
- ✅ System preference detection
- ✅ Type-safe API

**Implementation details in:** `src/contexts/ThemeContext.tsx`

## 🗄️ State Management

We use a **hybrid state management** approach that separates concerns:
- **Apollo Client** - Server state (data from backend)
- **Zustand** - Client state (UI preferences, filters)

### Why This Architecture?

**Problem**: Mixing server and client state leads to complexity.
**Solution**: Use the right tool for each type of state.

| State Type | Tool | Example |
|------------|------|---------|
| Server Data | Apollo Client | Agents, Tools, Runtimes from backend |
| UI State | Zustand | Modal open/closed, filters, search |
| System State | React Context | Theme, Auth session |

### Apollo Client - Server State

**What**: GraphQL client with normalized caching, real-time subscriptions, and optimistic updates.

**Key Features**:
- ✅ Normalized cache (update once, reflect everywhere)
- ✅ WebSocket subscriptions (real-time monitoring)
- ✅ Automatic refetching
- ✅ Optimistic UI updates
- ✅ Type-safe queries (generated hooks)

**Configuration**: `src/lib/apollo/`
```
apollo/
├── client.ts       # Apollo Client instance & cache config
├── links.ts        # HTTP, WebSocket, Auth, Error links
└── ApolloProvider.tsx  # Provider wrapper
```

**Generated Hooks** (via GraphQL Code Generator):
```tsx
import { useGetRuntimesQuery } from '@/graphql/generated/graphql';

function RuntimesList() {
  const { data, loading, error } = useGetRuntimesQuery();

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <div>{data?.workspace.map(ws => ...)}</div>;
}
```

**How Normalized Cache Works**:
```
Backend returns:
├─ Query 1: agents list → [Agent:123, Agent:456]
└─ Query 2: agent detail → Agent:123

Apollo Cache stores:
├─ Agent:123 { id, name, status, ... }
├─ Agent:456 { id, name, status, ... }
└─ ROOT_QUERY { agents: [ref:Agent:123, ref:Agent:456] }

Mutation updates Agent:123 → BOTH queries update automatically!
```

### Zustand - Client State

**What**: Lightweight state management for UI-only state.

**Why Zustand** (not Context):
- No provider wrapping
- Better performance (selective subscriptions)
- Simpler API than Redux
- Tiny (1KB)

**Stores**: `src/stores/`
```
stores/
├── uiStore.ts        # UI state (modals, filters, navigation)
└── workspaceStore.ts # Workspace selection
```

**UI Store Example**:
```tsx
import { useUIStore, useToolFilters } from '@/stores/uiStore';

// Option 1: Select entire store (re-renders on any change)
const uiState = useUIStore();

// Option 2: Select specific state (re-renders only when this changes) ✅
const deployModalOpen = useUIStore(state => state.deployModalOpen);

// Option 3: Use focused selector (best performance) ✅✅
const { category, setCategory } = useToolFilters();
```

**Workspace Store Example**:
```tsx
import { useWorkspaceId } from '@/stores/workspaceStore';

function MyComponent() {
  const workspaceId = useWorkspaceId();

  // Use in Apollo query
  const { data } = useGetToolsQuery({
    variables: { workspaceId },
    skip: !workspaceId, // Don't query without workspace
  });
}
```

### GraphQL Code Generation

**What**: Automatically generates TypeScript types and React hooks from GraphQL schema.

**Run codegen**:
```bash
npm run codegen        # Generate once
npm run codegen:watch  # Watch mode
```

**Configuration**: `codegen.ts`
- Schema source: `../backend/dist/apollo.schema.graphql`
- Operations: `src/graphql/**/*.graphql`
- Output: `src/graphql/generated/`

**Generated Files**:
```
src/graphql/generated/
├── graphql.ts        # All TypeScript types
├── gql.ts            # GraphQL tag function
└── index.ts          # Exports
```

**Writing Operations**:
```
src/graphql/
├── queries/
│   ├── workspaces.graphql
│   ├── runtimes.graphql
│   └── mcpTools.graphql
├── mutations/
│   └── deployAgent.graphql  # (example)
└── subscriptions/
    └── runtimeStatus.graphql
```

### Custom Hooks Pattern

**Why**: Wrap generated Apollo hooks with custom logic.

**Pattern**: `src/hooks/`
```tsx
// src/hooks/useRuntimes.ts
export function useRuntimes() {
  const { data, loading, error } = useGetRuntimesQuery({
    pollInterval: 30_000, // Poll every 30s
  });

  // Transform data
  const runtimes = data?.workspace.flatMap(ws => ws.runtimes ?? []) ?? [];

  // Calculate stats
  const stats = {
    total: runtimes.length,
    active: runtimes.filter(r => r.status === 'ACTIVE').length,
  };

  return { runtimes, stats, loading, error };
}
```

### Integration Example: Apollo + Zustand

**Tool Catalog** (combines both):
```tsx
// src/hooks/useToolCatalog.ts
export function useToolCatalog() {
  // Zustand: Get workspace & filters (client state)
  const workspaceId = useWorkspaceId();
  const filters = useToolFilters();

  // Apollo: Fetch tools (server state)
  const { data, loading } = useGetMCPToolsQuery({
    variables: { workspaceId },
    skip: !workspaceId,
  });

  // Combine: Client-side filtering
  const filteredTools = useMemo(() => {
    return data?.workspaceMCPTools?.mcpTools?.filter(tool =>
      tool.name.includes(filters.search)
    ) ?? [];
  }, [data, filters.search]);

  return { tools: filteredTools, loading, filters };
}
```

### State Management Decision Tree

```
Is this data from backend? → YES → Apollo Client
                         ↓ NO
Is it UI preference/filter? → YES → Zustand
                           ↓ NO
Is it system-level (theme)? → YES → React Context
```

### Best Practices

**DO:**
✅ Use Apollo for ALL backend data
✅ Use Zustand for filters, modal state, UI preferences
✅ Use Context for theme, auth session
✅ Combine Apollo + Zustand in custom hooks
✅ Use selective selectors in Zustand
✅ Run `npm run codegen` after schema changes

**DON'T:**
❌ Store backend data in Zustand
❌ Store UI state in Apollo cache
❌ Mix concerns (keep server/client state separate)
❌ Skip codegen (types will be stale)

## 🚀 Development

### Prerequisites

```bash
npm install
```

### Available Scripts

```bash
# Start dev server (http://localhost:8888)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint

# Generate GraphQL types and hooks
npm run codegen

# Generate in watch mode (development)
npm run codegen:watch
```

### VSCode Setup

Install recommended extensions when prompted:
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **ESLint** - Code linting
- **Prettier** - Code formatting

The `.vscode/settings.json` configures Tailwind to work with:
- `cn()` function
- TypeScript/TSX files
- CSS files with `@tailwind` directives

## 🎯 Pages

### LoginPage (`/login`)
- Email/password form
- Remember me checkbox
- Link to registration
- Theme toggle in top right

### RegisterPage (`/register`)
- Email/password/confirm password
- Terms of service acceptance
- Link to login
- Theme toggle in top right

### DashboardPage (`/dashboard`)
- Top navigation with user actions
- Secondary navigation tabs
- Stats grid
- Theme toggle

## 🔧 Configuration Files

### `tailwind.config.ts`

Extends Tailwind with:
- Design system colors (`border`, `input`, `ring`, etc.)
- Cyan brand color palette
- Border radius tokens
- Monospace font family
- Dark mode via `class` strategy

### `vite.config.ts`

- Path aliases (`@/` → `src/`)
- React SWC for fast refresh
- Dev server on port 8888

### `tsconfig.json`

- Strict mode enabled
- Path mapping for `@/*` imports
- React 19 JSX transform

## 🎨 Styling Guidelines

### DO:
✅ Use Tailwind utilities for all styling
✅ Reference design tokens (`bg-background`, `text-foreground`)
✅ Use `cn()` for conditional classes
✅ Follow dark mode pattern: `bg-white dark:bg-gray-800`
✅ Use semantic color names

### DON'T:
❌ Hardcode colors (`bg-gray-100` → `bg-muted`)
❌ Skip `cn()` when merging classes
❌ Forget dark mode variants
❌ Use inline styles
❌ Create separate CSS files (use Tailwind)

### Example Component

```tsx
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      // Base styles - from design system
      'bg-card text-card-foreground',
      'rounded-lg border border-border',
      'shadow-sm',
      // User overrides
      className
    )}>
      {children}
    </div>
  );
}
```

## 🔄 Migration from Frontend v1

This frontend is a complete rewrite, not an incremental update. Key differences:

| v1 | v2 | Why Changed |
|----|----|----|
| React 18 | React 19 | Latest features, better concurrent rendering |
| React Router 6 | React Router 7 | Modern data loading patterns |
| Custom components | Radix UI | Accessibility out of the box |
| Scattered styles | Design system | Consistency and maintainability |
| Manual dark mode | Context-based | Cleaner, more maintainable |

## 🚧 Next Steps

### Immediate Priorities
1. **Add Radix UI components** - Button, Input, Card, Dialog, etc.
2. **Authentication integration** - Connect to backend auth system
3. **Form validation** - Integrate with existing validation utils
4. **Error boundaries** - Production-ready error handling
5. **Real-time subscriptions** - Implement GraphQL subscriptions for live updates

### Future Enhancements
- Component library with Storybook
- E2E tests with Playwright
- Performance monitoring
- Accessibility audit
- Internationalization (i18n)

## 📚 Additional Resources

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Radix UI Docs](https://www.radix-ui.com)
- [React 19 Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## 🤝 Contributing

When adding new components or features:

1. **Follow the design system** - Use existing tokens
2. **Document your code** - Explain WHY, not just WHAT
3. **Type everything** - No `any` types
4. **Test dark mode** - Both themes should look great
5. **Keep it DRY** - Extract reusable patterns

---

**Built with ❤️ for the 2LY platform**

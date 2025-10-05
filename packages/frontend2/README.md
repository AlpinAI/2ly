# 2LY Frontend v2

Modern, production-ready frontend for the 2LY AI Tool Management Platform built with React 19, TypeScript, and Tailwind CSS.

## 🏗️ Architecture Overview

This is a complete rewrite of the original frontend (`/packages/frontend`), designed with scalability, maintainability, and modern best practices in mind.

### Tech Stack

- **React 19** - Latest React with concurrent features and optimized rendering
- **React Router 7** - Client-side routing with modern data loading patterns
- **TypeScript** - Full type safety across the application
- **Tailwind CSS** - Utility-first CSS with design system integration
- **Radix UI** - Unstyled, accessible UI primitives
- **Vite** - Lightning-fast build tool and dev server

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
│   ├── contexts/         # React contexts for global state
│   │   └── ThemeContext.tsx
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and helpers
│   │   └── utils.ts      # cn() for class merging
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
3. **State management** - Add React Query for server state
4. **Form validation** - Integrate with existing validation utils
5. **Error boundaries** - Production-ready error handling

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

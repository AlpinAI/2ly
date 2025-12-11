# Frontend Code Conventions

This document outlines coding conventions and best practices for the skilder frontend.

## Import Conventions

### Prefer Direct Imports Over Re-exports

**Rule**: Always import from the original source, not from re-export files.

#### ✅ Correct - Direct Imports

```typescript
// Apollo Client hooks - import from official package
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';

// React Router - import from official package
import { useNavigate, useParams, Link } from 'react-router-dom';

// External packages - import directly
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
```

#### ❌ Avoid - Jump Imports (Re-exports)

```typescript
// ❌ Don't import from re-export barrels
import { useQuery } from '@/lib/apollo/ApolloProvider';

// ❌ Don't import from index files that just re-export
import { Button } from '@/components';  // if index.ts just re-exports

// ❌ Don't create convenience re-exports
export { useQuery } from '@apollo/client/react';  // in a helper file
```

### Why Prefer Direct Imports?

1. **Clearer Dependencies**: Easy to see what packages your code depends on
2. **Better Tree-Shaking**: Build tools can optimize better with direct imports
3. **Easier Code Search**: `grep` and IDE search work better
4. **Standard Conventions**: Follows official package documentation
5. **Less Indirection**: Simpler mental model, easier to understand
6. **Refactoring Safety**: Easier to update when dependencies change

### Exceptions

Direct imports from official packages are preferred. However, these are acceptable:

✅ **Internal utilities**: Importing from your own utility files is fine
```typescript
import { cn } from '@/lib/utils';  // ✅ Your utility function
import { formatDate } from '@/lib/date-utils';  // ✅ Your helper
```

✅ **Barrel exports for YOUR components**: Only if you own the code
```typescript
import { Button, Card } from '@/components/ui';  // ✅ Your UI components
```

❌ **Don't re-export external packages**: Never wrap third-party packages
```typescript
// ❌ Don't do this
export { useQuery } from '@apollo/client/react';
export { useNavigate } from 'react-router-dom';
```

## Apollo Client Usage

### Importing Hooks

```typescript
// ✅ Correct
import { useQuery, useMutation, useLazyQuery, useSubscription } from '@apollo/client/react';

// ❌ Incorrect (Apollo v4 doesn't export from root)
import { useQuery } from '@apollo/client';
```

### Apollo Client v4 Changes

Apollo Client v4 requires imports from specific entry points:

- **Hooks**: `@apollo/client/react` (useQuery, useMutation, etc.)
- **Core**: `@apollo/client` (ApolloClient, InMemoryCache, etc.)
- **Links**: `@apollo/client/link/*` (HttpLink, etc.)

## TypeScript Conventions

### Type Your Mutations and Queries

Always provide type parameters to Apollo hooks:

```typescript
// ✅ Correct - Typed
const [createUser, { loading, error }] = useMutation<{
  createUser: {
    success: boolean;
    user: { id: string; name: string };
  };
}>(CREATE_USER_MUTATION);

// ❌ Incorrect - Untyped
const [createUser, { loading, error }] = useMutation(CREATE_USER_MUTATION);
```

## File Organization

### Component Imports Order

Organize imports in this order:

1. React and React-related
2. External packages (alphabetical)
3. Internal utilities and contexts
4. Internal components
5. Types
6. Styles

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. External packages
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';

// 3. Internal utilities and contexts
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// 4. Internal components
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';

// 5. Types
import type { User } from '@/types';

// 6. GraphQL
import { LOGIN_MUTATION } from '@/graphql/mutations/auth';

// 7. Styles (if any)
import styles from './LoginPage.module.css';
```

## Summary

- ✅ Import directly from source packages
- ❌ Avoid re-exports and barrel files for external packages
- ✅ Use TypeScript for type safety
- ✅ Follow Apollo Client v4 import conventions
- ✅ Keep imports organized and predictable

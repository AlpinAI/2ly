---
description: Use this command when scaffolding the new frontend
allowed-tools: Bash(npm run:*), Bash(docker:*), TodoWrite
---

# Context

You are a REACT engineer, and knows all the latest react API and good practice. You write typescript code, you ensure DRY principle and you take good care of architecturing the project in a way that it future-proof.

# Inspiration

- You take inspiration from the react project example you find in /skilder-new-design folder in the root of the project.
- /skilder-new-design is ONLY an inspiration, do not take code directly from here

# skilder frontend

- This new frontend will need to implement the same features we find in the current /packages/frontend 
- The /packages/frontend was our first MVP
- Now we want to code the real skilder frontend - future proof and well-architectured

# Project guidelines and structure

- The new frontend will be located in /packages/frontend
- Use typescript
- Use React, ALWAYS React 19
- Use React Router, ALWAYS React Router 7
- Place source code in /packages/frontend/src
- Put pages into /packages/frontend/src/pages
- Put components into /packages/frontend/src/components
- For the styling, USE TAILWIND
- Styles decision must come from a design system source in the frontend and be applied top-down to components
- Enforce consistency between components with shared styles, themes, color values etc
- ALWAYS use radix-ui as a foundation of components and UI. You can install any @radix-ui packages from npm
- Use vite for build and dev server

# Way of working

- ALWAYS work small step at a time and ask for user feedback.
- I want to build step by step to ensure good practice and architecture
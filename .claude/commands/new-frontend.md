---
description: Use this command when scaffolding the new frontend
allowed-tools: Bash(npm run:*), Bash(docker:*), TodoWrite
---

# Context

You are a REACT engineer, and knows all the latest react API and good practice. You write typescript code, you ensure DRY principle and you take good care of architecturing the project in a way that it future-proof.

# Inspiration

- You take inspiration from the react project example you find in /2ly-new-design folder in the root of the project.
- /2ly-new-design is ONLY an inspiration, do not take code directly from here

# 2ly frontend

- This new frontend will need to implement the same features we find in the current /packages/frontend 
- The /packages/frontend was our first MVP
- Now we want to code the real 2ly frontend - future proof and well-architectured

# Project guidelines and structure

- The new frontend will be located in /packages/frontend2
- Use typescript
- Use React, ALWAYS React 19
- Use React Router, ALWAYS React Router 7
- Place source code in /packages/frontend2/src
- Put pages into /packages/frontend2/src/pages
- Put components into /packages/frontend2/src/components
- For the styling, DO NOT use Tailwind, ALWYAYS use react components
- ALWAYS use radix-ui as a foundation of components and UI. You can install any @radix-ui packages from npm
- Use vite for build and dev server

# Way of working

- ALWAYS work small step at a time and ask for user feedback.
- I want to build step by step to ensure good practice and architecture
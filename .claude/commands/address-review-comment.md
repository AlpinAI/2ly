---
description: Address a comment from a recent review on a checked out PR
allowed-tools: Bash(git diff:*, git show:*, git log:*, npm run:*), View, Edit, Write, TodoWrite
---

# Task

Read the given review comment and address it.

# Workflow

1. **Understand context**: Read the comment and inspect the relevant code
2. **Assess validity**: Is the comment still relevant? If not, explain why and stop
3. **Plan**: Use the `plan` sub-agent. Avoid over-engineering unless explicitly requested
4. **Confirm**: Present the plan and ask user to respond:
   - "yes" → continue to step 5
   - feedback → incorporate it and return to step 3
5. **Implement**: Use the `typescript-architect` sub-agent
6. **Review**: Use the `typescript-code-reviewer` sub-agent
7. **Report**: Summarize changes + review findings. Let user decide next steps
---
description: Collect information, Plan, Code and Review the work. Provide a full-fledge feature
argument-hint: "[backend|frontend|runtime|all]"
allowed-tools: Bash(npm run:*), Bash(docker:*), TodoWrite
---

# Your task

1. Use the **requirements-writer** sub-agent to collect feature requirements and write comprehensive user-stories.
    - When you start you DO NOT KNOW what to do at all and do not make any assumption yourself
    - YOU MUST START by asking the user what he wants to do and continue by asking questions
    - Must create a feature-specs/XXXX folder containing a XXXX-spec.md file where XXXX is a relevant name representing the feature to develop
2. Use the **story-task-planner** sub-agent to write tasks-list for a coding agent
    - For small feature: one-task list can be enough -> write a single task-list file
    - For big feature: it's often best to split tasks in groups
    - Each group of tasks must have its own numeroted file and must represent a group of tasks that are shipable on their own
    - Files are numeroted in the order they should be accomplished
3. Work on one task-list at a time, with a cycle of coding and review
    3.a. Use the **typescript-architect** sub-agent to accomplish the given task-list
        - Do not forget to validate the tests `npm run test``
        - Do not forget to validate the code quality `npm run lint`, you can scope the linter by the package with `npm run lint -w @skilder-ai/backend` for the backend package for example.
    3.b. Use the **typescript-code-reviewer** sub-agent to review the work of the coding agent above
        - When the code-reviewer is OK with the changes, consider this task list finished and tick it on the task-list
        - You can only move to the next task-list when the current one is finished and validated
        - If the reviwer agent has feedbacks, provide them to the **typescript-architect** sub-agent to improve
    3.c. When a task-list is considered finished, request user-validation before to proceed to the next task-list
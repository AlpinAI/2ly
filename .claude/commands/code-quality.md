---
description: Ensure that the code do not have any typing or linting issue and that all tests are passing
allowed-tools: Bash(npm run:*), Bash(docker:*), TodoWrite
---

# Packages to analyse

- backend
- frontend
- runtime
- common

# Scope of work

If the user specify to work only in one specific package, only run the commands and work on issues specifically related to this package and IGNORE the others.

# Commands at your disposal

- `npm run lint` - analyze lint issues in the whole repo
- `npm run lint -w @skilder-ai/<package_name>` - analyze lint issues only in the given <package_name>
- `npm run typecheck` - analyze typescript issues in the whole repo
- `npm run typecheck -w @skilder-ai/<package_name>` - analyze typescript issues only in the given <package_name>
- `npm run test` - run the whole test suite
- `npm run test -- packages/<package_name>` - run tests only for a specific package (e.g., `packages/backend`)
- `npm run test -- packages/<package_name>/src/<folder>` - run tests for a specific folder within a package
- `npm run test -- -t "test name"` - run a specific test by name pattern
- `npm run test -- packages/<package_name> -t "test name"` - run a specific test within a package

# Your task

1. Ensure the `git status` is clean (no uncommitted changes), if not, ask the user to commit or stash changes before proceeding - EXCEPT if the user specifically says you can proceed anyway.
2. If the user did not specify the scope of your work, ask if you should focus on a single package or work on the whole repo
3. Execute lint, typecheck and test commands
   - If any command fails completely, report the failure and ask user how to proceed
   - Continue with remaining commands even if one fails (to get full picture)
4. Identify the most pressing issues and prepare a list of 1 to 10 items to address per run
   - Prioritize: compilation errors > type errors > lint errors > test failures
   - Focus on issues that block other fixes first
5. Use TodoWrite to track the selected issues before starting fixes
6. Use the **typescript-architect** sub-agent to address the 1 to 10 items selected
    - Specifically request to address the issues without creating new lint, typing or test issues
7. Use the **typescript-code-reviewer** sub-agent to review the work of the coding agent above
    - When the code-reviewer provides meaningful feedback, send them back to the **typescript-architect** sub-agent
        for fixing
    - ONLY move to the next phase when the code-reviewer gives the OK
8. Evaluate if you should continue or not - in order to keep the scope of this run reasonable
    - If 10+ files edited OR 400+ lines changed OR 30+ minutes elapsed -> STOP here and request user feedback on the work so far
    - Otherwise, go back to step 3 with the scope identified at step 2
9. When all checks pass clean:
   - Run final verification: `npm run lint && npm run typecheck && npm run test`
   - Report completion summary with files changed and issues resolved

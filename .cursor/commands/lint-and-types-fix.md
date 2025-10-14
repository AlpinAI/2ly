# Run All Tests and Fix Failures

## Overview
Execute the lint and typecheck scripts and systematically fix any issues, ensuring code quality and functionality.

## Steps
1. **Run lint script**
   - `npm run lint` from the root of the project
   - `npm run typecheck` from the root of the project
   - Capture output and identify issues
   - Check both lint and types issues

2. **Analyze issues**
   - Categorize by type: flaky, broken, new failures
   - Prioritize fixes based on impact
   - Check if issuses are related to recent changes

3. **Fix issues systematically**
   - Start with the most critical failures
   - Fix one issue at a time
   - Re-run tests after each fix

4. **Stop when 10+ files have been modified**
   - When you changed more than 10 files stop
   - Give back control to a human for review
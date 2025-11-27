---
description: Analyze, write, and validate unit and e2e tests with specialized agent squad
argument-hint: "[scope]"
allowed-tools: Task, Bash(npm:*), Bash(git:*), TodoWrite
model: sonnet
---

# Test Improvement Workflow

You are orchestrating a specialized agent squad to improve test coverage across the codebase. Your job is to coordinate the workflow, pass context between agents, and generate a final report.

## Scope Argument

The user may provide an optional scope argument:
- **No argument**: Analyze entire codebase, prioritize by risk
- **"branch"** or **"branch diff"**: Focus on files changed between current branch and main
- **"frontend"**, **"backend"**, **"runtime"**: Focus on specific package
- **Specific paths**: Focus on provided paths (e.g., "packages/frontend/src/components")

Store the scope argument for passing to agents: `$ARGUMENTS`

## Workflow Overview

```
0. E2E PREBUILD → Build Docker images for E2E tests
1. ANALYZE      → test-analyzer agent
2. WRITE        → test-writer agent
3. RUN          → test-runner agent (with E2E rebuild if needed)
4. REVIEW       → test-reviewer agent
5. FIX          → typescript-architect OR test-writer (loop back to step 3)
6. QUALITY GATE → Final validation that ALL checks pass
7. REPORT       → Final summary (you generate this)
```

**Iteration Limits**:
- **Fix iterations**: Maximum **5 attempts** for debugging/fixing
- **Quality gate**: Unlimited attempts until all checks pass or unrecoverable blocker

**Key Behaviors**:
- E2E images built at start and whenever backend/runtime implementation changes
- Workflow only completes when lint, typecheck, unit tests, and E2E tests ALL pass
- Quality gate runs after reviewer says PASS to verify all checks are truly green

## Step-by-Step Instructions

### Step 0: E2E Prebuild (Before Starting)

**CRITICAL FIRST STEP**: Before any analysis or testing, build E2E Docker images.

**When to run**:
- **Always** at the start of the workflow
- Ensures fresh images before any testing begins

**Command**:
```bash
npm run test:e2e:prebuild
```

**What this does**:
- Builds Docker images for backend and runtime services
- Required for E2E tests to run against current code state
- Takes ~90-180 seconds typically

**If build fails**:
- Document the failure in final report
- May indicate infrastructure issues
- Workflow can continue for unit/integration tests only

**Store for later**:
- Prebuild status (success/failure)
- Build duration
- Any error messages

---

### Step 1: Analyze Test Opportunities

**Use sub-agent**: `test-analyzer`

**Pass context**:
- Scope argument (if provided): `$ARGUMENTS`
- Instruction to focus on one area at a time
- Reminder to avoid over-engineering

**What you'll receive back**:
- Selected focus area with rationale
- 3-5 specific test improvement opportunities
- Recommendations for test patterns and mocking

**Store for later**:
- Focus area name
- Opportunities list
- Deferred areas (for final report)

---

### Step 2: Write Tests

**Use sub-agent**: `test-writer`

**Pass context**:
- The complete test improvement analysis from test-analyzer
- Focus area
- Test opportunities with specific details

**What NOT to pass**:
- Raw codebase exploration results
- Unrelated test patterns
- Deferred opportunities

**What you'll receive back**:
- List of test files created/modified
- Test cases added
- Mocking strategies used
- Any dependencies added

**Store for later**:
- Test files created (for test-runner)
- Test count (for final report)
- Test types (unit/integration/e2e)
- **Implementation modified flag** (YES/NO from test-writer report)
- **Packages modified** (if implementation was changed)

---

### Step 3: Run Tests

**Use sub-agent**: `test-runner`

**Pass context**:
- List of test files created/modified
- Scope (which packages affected)
- Test types to run (unit, integration, e2e)
- **Implementation changed flag**: YES if backend/runtime implementation was modified (from test-writer or typescript-architect)
- **Iteration number**: Current iteration count (for test-runner to know if first run)

**What NOT to pass**:
- The test code itself
- Analysis or writing reports
- Unrelated context

**What you'll receive back**:
- Test execution report with results for:
  - Lint
  - Typecheck
  - Unit tests
  - Integration tests (if applicable)
  - E2E tests (if applicable)
- Summary of passed/failed tests
- Specific failure details

**Store for later**:
- Overall pass/fail status
- Failure details (for reviewer)

---

### Step 4: Review Results

**Use sub-agent**: `test-reviewer`

**Pass context**:
- Test execution report from test-runner
- Test writing report from test-writer
- Current iteration count (start at 1, max 5)

**What NOT to pass**:
- Original analysis
- Full test code
- Unrelated execution history

**What you'll receive back**:
One of these decisions:
- **✅ PASS**: All tests passing, workflow complete
- **🔧 FIX_TESTS**: Issues in test code, needs test-writer to fix
- **🛠️ FIX_IMPL**: Issues in implementation, needs typescript-architect to fix
- **❌ FAIL**: Blocker requiring human intervention

Plus specific guidance for the next agent (if fixing needed)

---

### Step 5a: Fix Tests (if reviewer decided FIX_TESTS)

**Use sub-agent**: `test-writer`

**Pass context**:
- Test reviewer's guidance
- Specific problems identified
- Files that need fixing

**What NOT to pass**:
- Full test execution logs
- Unrelated test files
- Original opportunities

Increment iteration count.

**After completion**: Loop back to **Step 3** (Run Tests)

---

### Step 5b: Fix Implementation (if reviewer decided FIX_IMPL)

**Use sub-agent**: `typescript-architect`

**Pass context**:
- Test reviewer's guidance
- Specific implementation issues identified
- Expected behavior based on tests
- Files that need fixing

**What NOT to pass**:
- Test code
- Test execution logs
- Test improvement opportunities

Increment iteration count.

**CRITICAL**: After typescript-architect completes:
- Check which packages were modified (from reviewer's report)
- Set **implementation changed flag** to YES if backend or runtime was modified
- This triggers E2E image rebuild in next Step 3

**After completion**: Loop back to **Step 3** (Run Tests)

---

### Step 6: Quality Gate Validation

**When**: After reviewer decides **✅ PASS**

**CRITICAL**: Do not trust the PASS decision blindly. Verify that ALL checks actually passed.

**Validation Steps**:

1. **Review the test-runner report** from the latest execution
2. **Verify each quality check**:
   - E2E Image Build: ✅ SUCCESS (or ⏭️ N/A if no E2E tests)
   - Lint: ✅ 0 errors, 0 warnings (not just "PASS")
   - Typecheck: ✅ 0 errors (not just "PASS")
   - Unit Tests: ✅ All passed (check actual counts)
   - Integration Tests: ✅ All passed or ⏭️ N/A
   - E2E Tests: ✅ All passed or ⏭️ N/A

3. **If ANY check has issues**:
   - Loop back to Step 3 (Run Tests)
   - Do NOT count against fix iteration limit (quality gate is separate)
   - Pass updated context to test-runner

4. **Only proceed to Step 7** when verification confirms all checks are truly green

**Quality Gate Iterations**:
- Unlimited attempts (separate from 5 fix iterations)
- Only stop if:
  - All checks verified green → Proceed to Step 7
  - Unrecoverable blocker → Generate report with BLOCKED status

---

### Step 7: Generate Final Report

**When**: After **Step 6 Quality Gate** confirms all checks pass OR reviewer decides **❌ FAIL**

**You generate this** (not an agent):

```markdown
# Test Improvement Report

## Summary
- **Status**: [✅ SUCCESS | ❌ BLOCKED]
- **Scope**: [What was analyzed]
- **Focus Area**: [Area selected for improvement]
- **Fix Iterations**: [N] of 5
- **Quality Gate Iterations**: [N] (separate from fix iterations)
- **E2E Images Rebuilt**: [N] times
- **Duration**: [Approximate time]

---

## Test Coverage Added

### Unit Tests
- **Files Created**: [N]
- **Test Cases**: [N]
- **Key Areas**:
  - [Component/Service 1]: [Brief description]
  - [Component/Service 2]: [Brief description]

### Integration Tests
- **Files Created**: [N]
- **Test Cases**: [N]
- **Key Areas**: [Same format]

### E2E Tests
- **Files Created**: [N]
- **Test Cases**: [N]
- **Key Scenarios**: [Same format]

---

## Quality Checks

- **E2E Image Build**: [✅ | ❌ | ⏭️ N/A] ([Duration] per build, [N] builds total)
- **Lint**: [✅ | ❌] (0 errors, 0 warnings | [Details if failed])
- **Typecheck**: [✅ | ❌] (0 errors | [Details if failed])
- **Unit Tests**: [✅ | ❌] ([N] passed / [Total])
- **Integration Tests**: [✅ | ❌ | ⏭️ N/A] ([N] passed / [Total])
- **E2E Tests**: [✅ | ❌ | ⏭️ N/A] ([N] passed / [Total])

---

## Key Decisions

### Why This Area?
[Rationale from test-analyzer for choosing this focus area]

### Test Patterns Used
- [Pattern 1]: [Why it was chosen]
- [Pattern 2]: [Why it was chosen]

### Areas Deferred
- [Area 1]: [Reason]
- [Area 2]: [Reason]

---

## Implementation Fixes

[If typescript-architect was used]

### Issues Found
- [Issue 1]: [Description and fix]
- [Issue 2]: [Description and fix]

### Files Modified
- `path/to/file.ts`
- `path/to/another.tsx`

---

## Blockers

[Only if status is ❌ BLOCKED]

### Issue
[Description of the blocking issue]

### Recommendation
[What needs to happen to unblock]

---

## Next Steps

[If ✅ SUCCESS]:
- Tests are integrated and passing
- Consider running `/code-quality` for final validation
- Ready for commit and PR

[If ❌ BLOCKED]:
- Review blockers section above
- Address the recommended actions
- Re-run `/improve-tests` with adjusted scope if needed
```

## Workflow Control

### Iteration Limit

Track iterations in a counter variable starting at 1.

**After each fix** (Step 5a or 5b):
- Increment counter
- Check: if counter > 5, treat as **❌ FAIL** and skip to Step 6

### Early Exit Conditions

**Exit to Step 6 (Quality Gate)** if:
- Reviewer decides **✅ PASS** → Validate in quality gate before final report
- Fix iteration count exceeds 5 → Generate final report with iteration limit explanation

**Exit to Step 7 (Final Report)** immediately if:
- Reviewer decides **❌ FAIL** (unrecoverable blocker)
- Same FIX decision made 3 times in a row (indicates looping)
- Quality gate detects unrecoverable issue

**Never exit** on:
- Quality gate failures → Loop back to Step 3 to fix
- Warnings in lint (must be 0)
- Partial test passes (all must pass)

### Context Management

**DO**:
- Pass minimal, focused context to each agent
- Store key information for final report
- Track fix iteration count carefully (max 5)
- Track quality gate iterations separately (unlimited)
- Track implementation changed flag (for E2E rebuild)
- Track E2E rebuild count (for final report)
- Keep workflow moving forward

**DON'T**:
- Pass full conversation history to agents
- Include unrelated details in agent prompts
- Let agents see other agents' internal reasoning
- Allow infinite loops

## Best Practices

### Agent Communication

Each agent should receive:
1. **Their specific task**: Clear, focused instruction
2. **Necessary context**: Only what they need to complete their task
3. **Constraints**: Scope, iteration limits, focus areas

### Error Handling

If an agent returns unexpected output:
1. Review what was asked vs what was received
2. Try to proceed with available information
3. If blocked, document in final report

### Time Management

This workflow should complete in:
- **Fast**: 5-10 minutes (simple test additions, no fixes)
- **Normal**: 15-25 minutes (moderate complexity, 1-2 fix iterations)
- **Complex**: 30-45 minutes (multiple iterations, implementation fixes)

If exceeding these timeframes, consider stopping and reporting blockers.

## Example Usage

### Example 1: Simple Scope
```
User: /improve-tests frontend
[Workflow analyzes frontend package, writes unit tests for components, all pass]
```

### Example 2: Branch Scope
```
User: /improve-tests branch
[Workflow analyzes git diff, focuses on changed files, adds tests for new features]
```

### Example 3: With Fixes
```
User: /improve-tests
[Workflow analyzes codebase, writes tests, tests reveal bug, typescript-architect fixes bug, tests pass]
```

### Example 4: Blocked
```
User: /improve-tests backend
[Workflow tries to write integration tests, testcontainers fail to start, reports blocker after 3 attempts]
```

## Important Reminders

1. **Build E2E images first**: Run `npm run test:e2e:prebuild` before starting
2. **Rebuild when needed**: Trigger E2E rebuild when backend/runtime implementation changes
3. **Stay focused**: One area at a time, as identified by test-analyzer
4. **Avoid over-engineering**: Trust test-analyzer's prioritization
5. **Pass minimal context**: Each agent gets only what they need
6. **Track fix iterations**: Stop at 5 for debugging/fixing
7. **Quality gate is separate**: Unlimited attempts to get all checks green
8. **Document decisions**: Capture "why" for final report
9. **Verify before finishing**: Quality gate must confirm all checks pass
10. **Generate final report**: Always end with a comprehensive summary

## You Are the Conductor

Your role is to:
- **Build E2E images** at the start and when implementation changes
- **Orchestrate the agent squad** efficiently
- **Pass the right context** to each agent (including implementation changed flags)
- **Track progress**: Fix iterations (max 5), quality gate iterations (unlimited), E2E rebuilds
- **Make decisions** about workflow control
- **Enforce quality gates**: Don't finish until all checks are green
- **Track implementation changes**: Know when to rebuild E2E images
- **Generate the final comprehensive report** with all metrics

Execute this workflow with precision, enforce comprehensive quality validation, and deliver a clear, actionable report at the end.

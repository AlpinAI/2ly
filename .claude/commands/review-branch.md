---
name: review-branch
description: Comprehensive autonomous code review comparing current branch to main
---

# Comprehensive Code Review - Autonomous Analysis

I need a complete and autonomous code review of my current branch compared to `main`.

## Working Instructions
- Work **autonomously and thoroughly** without asking me for confirmations
- Compare all changes between my current branch and `main`
- Analyze **all modified files** in depth
- Take the time needed for an exhaustive analysis

## Review Scope

Analyze the following aspects for each change:

1. **Functionality & Logic**
   - Potential bugs or unhandled edge cases
   - Business logic consistency
   - Error handling

2. **Best Practices**
   - Language/framework standards
   - Patterns and anti-patterns
   - Security (injections, XSS, authentication, etc.)

3. **Simplicity & Readability**
   - Code that can be simplified
   - Excessive cyclomatic complexity
   - Naming and clarity

4. **Architecture & Maintainability**
   - Coupling and cohesion
   - Necessary refactoring
   - Technical debt introduced
   - Separation of concerns

5. **Performance**
   - Inefficient algorithms
   - N+1 queries
   - Potential memory leaks
   - Possible optimizations

6. **Testing**
   - Unit test coverage
   - Integration test quality
   - Missing or incomplete E2E tests
   - Untested edge cases

7. **Documentation**
   - Comment quality
   - Missing technical documentation
   - Outdated or misleading comments

8. **Improvements**
   - Opportunities to improve existing code
   - Evolution suggestions

## Final Report Format

Produce a structured Markdown report as follows:

### 📊 Executive Summary
- Total number of files analyzed
- Overall quality score (/10)
- 3-5 key takeaways

### 🔴 Critical Issues (High Priority)
For each critical issue:
- **File:** `path/to/file.ext:line`
- **Issue:** Clear description
- **Impact:** Why this is critical
- **Proposed Solution:** Recommended code or approach
- **Tradeoffs:** Pros/cons of the solution
- **Effort Estimate:** Time/complexity to fix

### 🟡 Important Issues (Medium Priority)
[Same structure as above]

### 🟢 Minor Issues (Low Priority)
[Same structure as above]

### ✨ Suggested Improvements
- Non-blocking but beneficial improvements
- Possible optimizations
- Code quality enhancements

### 📋 Recommended Action Plan
Ordered and prioritized list of corrections to apply:
1. [Priority action 1] - Estimate: X time - Impact: Y
2. [Priority action 2] - Estimate: X time - Impact: Y
...

### 📈 Metrics
- Test coverage before/after (if detectable)
- Complexity added/removed
- Lines of code modified
- Technical debt score change

### 🎯 Quick Wins
List of easy fixes with high impact (low-hanging fruit)

---

**Start the analysis now. Do not ask me for any confirmation. Work autonomously and produce the complete report at the end.**
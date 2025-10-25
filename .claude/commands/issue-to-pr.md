---
name: issue-to-pr
description: Automates the workflow from labeled GitHub issues to ready-to-review pull requests.
allowed-tools: Bash(gh issue *), Bash(gh pr *), Bash(git *), FileEditor
model: claude-sonnet-4-5
---

# Issue to PR Command

Automates the workflow from labeled GitHub issues to ready-to-review pull requests.

## Workflow

1. **Fetch issues** with `issue-to-pr` label (without `in-progress`)
2. **Analyze grouping** - decide if issues share context
3. **Confirm with user** if grouping is uncertain
4. **Setup**: Assign issues, create branch
5. **Delegate to implementation agent** for coding
6. **Delegate to validation agent** for quality checks
7. **Create PR** with comprehensive report

## Grouping Rules

Calculate score for each issue pair:
- Same file/module: +3
- Sequential dependency: +3
- Same component: +2
- Different features: -5
- Mixed types (bug+feature): -3

**Decision:**
- Score >8: Auto-group
- Score 6-8: Ask user confirmation
- Score <6: Work on single issue only

**Max 3 issues per group**. When in doubt, prefer single issue.

## Steps

### 1. Fetch Issues
```bash
gh issue list --label "issue-to-pr" --json number,title,body,labels --jq '.[] | select(.labels | map(.name) | contains(["in-progress"]) | not)'
```

### 2. Analyze & Select

For each issue, analyze:
- Files likely affected
- Feature area/module
- Complexity estimate
- Dependencies on other issues

Calculate grouping scores. Present analysis to user with recommendation.

**If score 6-8:** Ask user: "Should I group issues #X and #Y? (y/n)"

Select issue(s) to work on (prioritize by age/severity if multiple candidates).

### 3. Setup

Assign selected issue(s):
```bash
gh issue edit {issue_number} --add-assignee "@me" --add-label "in-progress"
```

Create branch:
- Single issue: `issue-{number}-{brief-description}`
- Multiple: `issue-{num1}-{num2}-{theme-description}`

```bash
git checkout -b {branch_name}
```

### 4. Delegate to Implementation Agent

Use sub-agent: `issue-implementation`

**Pass minimal context:**
- Issue number(s), title(s), body/bodies
- Acceptance criteria
- Relevant file paths (if known)

**Instructions to agent:**
- Implement solution for issue(s)
- Write unit/integration/e2e tests as appropriate
- Document decisions made
- Report: files changed, approach taken, test coverage

**Do NOT pass:** Triage logic, grouping analysis, PR creation details.

### 5. Delegate to Validation Agent

Use sub-agent: `issue-validation`

**Pass minimal context:**
- Implementation report summary
- List of changed files
- Branch name

**Instructions to agent:**
- Run `npm run lint`, `npm run typecheck`, `npm test`
- Fix any failures iteratively
- Ensure all checks pass
- Report: validation status, any fixes applied

**Do NOT pass:** Original issue details, implementation context.

### 6. Create Pull Request

Combine reports from both agents.

```bash
gh pr create \
  --title "{Concise PR title}" \
  --body "{PR description}" \
  --label "pr-to-review"
```

**PR Description Template:**
```markdown
## Issues Addressed
Closes #{issue_number}
[Closes #{issue_number2}]

## Implementation Summary
{Summary from implementation agent}

## Changes Made
- {Key changes}
- {Key changes}

## Testing
{Test coverage from implementation agent}

## Validation
{Results from validation agent}

## Decisions & Trade-offs
{Notable decisions from implementation agent}
```

## Error Handling

- If validation fails after multiple attempts: Report to user, keep branch, don't create PR
- If implementation agent gets stuck: Report to user with current state
- If no suitable issues found: Inform user, exit gracefully
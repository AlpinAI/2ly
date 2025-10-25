---
name: intent-to-issue
description: Transform a rough feature wish into a clarified GitHub issue
allowed-tools: Bash(gh issue create:*), Bash(git status:*)
model: claude-sonnet-4-5
---

# Intent to Issue Command

## Purpose
This command helps transform vague feature requests or wishes into well-defined, actionable GitHub issues through an iterative clarification process.

## Workflow

### Phase 1: Capture the Wish
First, capture the user's initial request exactly as stated.

**User Input Template:**
```
Wish: ${input}
```

### Phase 2: Analyze Context
Before responding, analyze the codebase to understand:

1. **Related Files**: What files would be affected by this change?
2. **Current Implementation**: How is this currently working (if at all)?
3. **Technical Scope**: What components/systems are involved?
4. **Dependencies**: What other parts of the code depend on or relate to this?

**Self-Check Questions:**
- What files contain the functionality mentioned?
- Are there existing patterns or conventions in the codebase for this type of change?
- What technologies/frameworks are being used in this area?
- Are there tests that would need updating?

### Phase 3: Rephrase and Confirm

Respond with a structured clarification using this format:

```markdown
## Understanding Check

**Original Request:**
"${input}"

**My Interpretation:**
[Provide a detailed, technical interpretation of what you understand]

**What I think you want:**
1. [Specific action 1]
2. [Specific action 2]
3. [Specific action 3]

**Affected Components:**
- `path/to/file1.ext` - [Why this file]
- `path/to/file2.ext` - [Why this file]

**Scope:**
- [ ] Frontend changes
- [ ] Backend changes
- [ ] Database changes
- [ ] API changes
- [ ] Configuration changes
- [ ] Documentation updates
- [ ] Tests updates

**Questions/Assumptions:**
1. [Any assumptions I'm making]
2. [Any clarifications needed]

**Is this understanding correct?**
- Reply "yes" to proceed with issue creation
- Reply "no" with corrections
- Reply "edit [aspect]" to refine a specific part
```

### Phase 4: Iterative Refinement
If the user provides corrections or additional details:
- Acknowledge the correction
- Update your understanding
- Present the revised interpretation
- Ask for confirmation again

**Continue until you receive explicit "yes" confirmation.**

### Phase 5: Generate GitHub Issue

Once confirmed, generate a complete GitHub issue specification:

```markdown
## GitHub Issue Ready ✓

I'll create an issue with the following content:

---

**Title:**
[Concise, descriptive title following conventional commit format]
feat/fix/docs/refactor: [Brief description]

**Labels:**
- `intent-to-issue` (always required)
- `bug` (if this is a bug fix)
- `dev` (if this is an enhancement or new feature)

DO NOT ADD other label

**Body:**

### Description
[Clear description of what needs to be done]

### Context
Original request: "${input}"

### Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]

### Technical Implementation Notes
**Files to Modify:**
- `path/to/file1.ext`
  - [ ] [Specific change needed]
- `path/to/file2.ext`
  - [ ] [Specific change needed]

**Approach:**
[Suggested implementation approach]

**Considerations:**
- [Important technical consideration 1]
- [Important technical consideration 2]

### Testing Requirements
- [ ] Unit tests updated/added
- [ ] Integration tests updated/added
- [ ] Manual testing checklist provided

### Documentation Updates
- [ ] Code comments added/updated
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)

### Dependencies
[List any related issues, PRs, or external dependencies]

---

**Shall I create this issue?**
- Reply "yes" to create the issue
- Reply "edit [section]" to modify a specific section
- Reply "no" to cancel
```

### Phase 6: Issue Creation Confirmation

After the user confirms with "yes", provide:

```markdown
## Issue Creation Command

To create this issue, run:

```bash
gh issue create \
  --title "[title]" \
  --body-file /tmp/issue-body.md \
  --label "intent-to-issue,bug" \
  --assignee @me
```

Note: Replace "bug" with "dev" if this is an enhancement/feature instead of a bug fix.

Or if you want me to create it directly, I can do that now.

**Next Steps:**
1. Issue will be created with number #XXX
2. You can then trigger the background implementation with:
   `/implement #XXX`
3. Or manually start work with:
   `git checkout -b feature/issue-XXX`
```

## Command Behavior Rules

### DO:
- ✓ Always analyze the codebase before responding
- ✓ Be specific about file paths and line numbers when relevant
- ✓ Ask clarifying questions when ambiguous
- ✓ Use actual code patterns found in the project
- ✓ Consider edge cases and potential issues
- ✓ Break down complex requests into clear steps
- ✓ Provide testable acceptance criteria
- ✓ Always include "intent-to-issue" label
- ✓ Add "bug" label for bug fixes, "dev" label for enhancements/features

### DON'T:
- ✗ Make assumptions without stating them
- ✗ Proceed without explicit confirmation
- ✗ Create vague or generic issue descriptions
- ✗ Skip the clarification phase
- ✗ Ignore existing code patterns
- ✗ Forget to mention testing requirements

## Examples

### Example 1: Simple Request
**User:** `/intent-to-issue crop the tool description to one line on the tools table`

**Assistant:** 
```
## Understanding Check

**Original Request:**
"crop the tool description to one line on the tools table"

**My Interpretation:**
You want to limit the tool descriptions in a table display to show only the first line (or truncate to a single line) instead of showing the full multi-line descriptions.

**What I think you want:**
1. Find where tool descriptions are rendered in a table
2. Modify the display to show only one line of the description
3. Possibly add truncation with ellipsis (...) if descriptions are longer
4. Maybe add a hover tooltip to show the full description

**Affected Components:**
- `src/components/ToolsTable.tsx` - Main table component rendering tools
- `src/utils/textHelpers.ts` - May need a truncate function

**Scope:**
- [x] Frontend changes
- [ ] Backend changes
- [ ] Database changes
- [ ] API changes
- [ ] Configuration changes
- [ ] Documentation updates
- [x] Tests updates

**Questions/Assumptions:**
1. Should we truncate at exactly one line (word wrap) or at a character limit?
2. Should there be a way to see the full description (hover, click, modal)?
3. Should this apply to all tables or a specific one?

**Is this understanding correct?**
```

### Example 2: Complex Request
**User:** `/intent-to-issue add authentication to the API`

**Assistant:**
```
## Understanding Check

**Original Request:**
"add authentication to the API"

**My Interpretation:**
This is a broad request. I need clarification on several aspects.

**What I think you might want (multiple possibilities):**
1. Add JWT-based authentication to protect existing endpoints
2. Add OAuth2 integration with external providers
3. Add API key authentication for third-party access
4. Add session-based authentication
5. All of the above with multiple auth strategies

**Affected Components:**
- `src/api/` - All API routes would need protection
- `src/middleware/` - New auth middleware needed
- `src/models/User.ts` - User model may need updates
- `src/config/` - Auth configuration needed
- Database schema - May need tokens/sessions table

**Scope:**
- [x] Backend changes
- [x] Database changes
- [x] API changes
- [x] Configuration changes
- [x] Documentation updates
- [x] Tests updates
- [ ] Frontend changes (depending on approach)

**Questions/Assumptions:**
1. **Which authentication method?** (JWT, OAuth, API keys, sessions, or multiple?)
2. **Protect all endpoints or specific ones?**
3. **User registration flow needed too, or just login?**
4. **Password reset flow required?**
5. **Role-based access control (RBAC) needed?**
6. **Existing user system or starting fresh?**

This needs more details before I can create a good issue. Can you clarify the authentication approach you prefer?
```

## Configuration

Place this file in your project at:
```
.claude/commands/intent-to-issue.md
```

Or if using Claude Code configuration:
```
.claude/instructions/intent-to-issue.md
```

## Testing the Command

Test with these examples:
1. `/intent-to-issue add dark mode`
2. `/intent-to-issue fix the broken search functionality`
3. `/intent-to-issue improve performance of the dashboard`
4. `/intent-to-issue crop the tool description to one line on the tools table`
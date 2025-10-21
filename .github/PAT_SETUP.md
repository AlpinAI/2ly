# Personal Access Token (PAT) Setup

## Why Do We Need This?

When GitHub Actions uses the default `GITHUB_TOKEN` to push tags, it **does not trigger other workflows** as a security feature to prevent recursive workflow runs.

To allow the release workflow to trigger the docker-build and npm-publish workflows when it creates version tags, we need to use a **Personal Access Token (PAT)** instead.

## How It Works

```
Release Workflow (uses PAT)
    ↓ creates tag v0.1.0
    ↓ pushes with PAT (not GITHUB_TOKEN)
    ↓
Triggers other workflows:
    → docker-build.yml
    → npm-publish.yml
```

## Setting Up the PAT

### 1. Create a Personal Access Token

Choose one of these options:

#### Option A: Fine-Grained PAT (Recommended - More Secure)

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure the token:
   - **Token name**: `2ly-release-automation`
   - **Expiration**: Choose your preference (90 days recommended, with calendar reminder to renew)
   - **Repository access**: Select **Only select repositories** → Choose `2ly` repository
   - **Permissions**:
     - **Contents**: Read and write ✓
     - **Metadata**: Read-only (automatically selected)
4. Click **Generate token**
5. **Copy the token** (you'll only see it once!)

#### Option B: Classic PAT (Simpler but broader permissions)

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Configure the token:
   - **Note**: `2ly-release-automation`
   - **Expiration**: Choose your preference (90 days recommended)
   - **Scopes**: Select only `repo` (Full control of private repositories)
4. Click **Generate token**
5. **Copy the token** (you'll only see it once!)

### 2. Add Token to GitHub Repository Secrets

1. Go to your `2ly` repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Create the secret:
   - **Name**: `PAT_TOKEN`
   - **Value**: Paste your Personal Access Token
5. Click **Add secret**

## Verification

After setting up the PAT, test the complete flow:

1. Bump version: `npm run bump-version:patch`
2. Commit and create PR to main
3. Merge the PR
4. Watch the workflows:
   - `release.yml` should create the tag
   - `docker-build.yml` should automatically start
   - `npm-publish.yml` should automatically start

## Token Expiration

Personal Access Tokens expire for security. When yours expires:

1. You'll notice that merging to main creates the release but doesn't trigger builds
2. Generate a new token following the same steps above
3. Update the `PAT_TOKEN` secret in repository settings
4. No code changes needed!

**Pro tip**: Set a calendar reminder 1 week before expiration to renew the token.

## Troubleshooting

### Error: "Permission denied" when pushing tag

**Symptom**: Release workflow fails with:
```
remote: Permission to AlpinAI/2ly.git denied to [username].
fatal: unable to access 'https://github.com/AlpinAI/2ly/': The requested URL returned error: 403
```

**Most Common Causes** (even for organization owners):

#### 1. **SSO/SAML Authorization Required** ⭐ Most Likely

If your organization uses SSO (SAML), you MUST authorize the PAT:

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Find your token in the list
3. Look for **"Configure SSO"** or **"Authorize"** button next to the token
4. Click it and authorize the token for the **AlpinAI** organization
5. Retry the workflow

**Note**: Even organization owners need to do this step if SSO is enabled!

#### 2. **Fine-Grained PAT: Repository Not Selected**

If you created a fine-grained PAT:

1. Go to your PAT settings
2. Edit the token
3. Under **Repository access**, ensure you selected:
   - **"Only select repositories"** → Check **"2ly"** is in the list
   - OR use **"All repositories"** (less secure)
4. Save and retry

#### 3. **Organization PAT Restrictions**

Check if the organization restricts PAT usage:

1. Go to **AlpinAI** organization → **Settings** → **Personal access tokens**
2. Check the policy settings
3. If restricted, allowlist your PAT or adjust the policy

#### 4. **Classic PAT: Missing Scopes**

Ensure your classic PAT has the **`repo`** scope (full control of private repositories)

### Workflows Still Not Triggering

**Check 1: PAT_TOKEN is set**
- Go to Settings → Secrets → Actions
- Verify `PAT_TOKEN` exists

**Check 2: Token has correct permissions**
- Fine-grained: Must have "Contents: Read and write"
- Classic: Must have "repo" scope

**Check 3: Token hasn't expired**
- Check your GitHub token list
- Regenerate if expired

**Check 4: Token is for correct user**
- The PAT should be from a user with **write access** to the repository
- Organization tokens may have additional restrictions
- For "AlpinAI/2ly": User must be in AlpinAI organization with write permissions

### Manual Trigger Workaround

If the PAT isn't set up yet, you can manually trigger the workflows:

1. Go to **Actions** tab
2. Select `docker-build.yml` workflow
3. Click **Run workflow** → Select the tag (e.g., `v0.1.0`)
4. Repeat for `npm-publish.yml`

## Security Notes

- **Keep tokens secret**: Never commit tokens to code or share them publicly
- **Minimal permissions**: Use fine-grained tokens when possible
- **Regular rotation**: Rotate tokens every 90 days
- **Monitor usage**: Check GitHub's token usage logs periodically
- **Revoke if compromised**: If a token is exposed, revoke it immediately and create a new one

## Alternative: GitHub App

For production environments with high security requirements, consider using a GitHub App instead of a PAT:
- More granular permissions
- Better audit trails
- Doesn't depend on a user account
- More complex setup

See [GitHub's documentation](https://docs.github.com/en/apps) for details.

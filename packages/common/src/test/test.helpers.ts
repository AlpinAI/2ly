import * as path from 'path';
import * as fs from 'fs';

/**
 * Find the project root by looking for package.json with workspaces
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
    let currentDir = startDir;
  
    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, 'package.json');
  
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
        // Check if this is a workspace root (has workspaces field)
        if (packageJson.workspaces) {
          return currentDir;
        }
      }
  
      // Move up one directory
      currentDir = path.dirname(currentDir);
    }
  
    // Fallback to current directory
    return process.cwd();
  }
  
  /**
     * Wait for a health endpoint to become available
     * @param url - The health endpoint URL to check
     * @param maxRetries - Maximum number of retry attempts
     * @param intervalMs - Delay between retries in milliseconds
     */
  export async function waitForHealth(url: string, maxRetries: number, intervalMs: number, log = false): Promise<void> {
    if (log) {
      console.log(`Waiting for health check: ${url}`, { maxRetries, intervalMs });
    }
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return;
        }
      } catch (error) {
        if (log) {
          console.log(`Health check failed: ${url}`, { attempt, error: error instanceof Error ? error.message : String(error) });
        }
      }
  
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    if (log) {
      console.log(`Health check failed after ${maxRetries} attempts: ${url}`);
    }
    throw new Error(`Health check failed after ${maxRetries} attempts: ${url}`);
  }
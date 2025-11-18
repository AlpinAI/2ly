import * as path from 'path';
import * as fs from 'fs';
import { testLog, testError } from './test.containers.logger';

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
  export async function waitForHealth(url: string, maxRetries: number = 10, intervalMs: number = 1000): Promise<void> {
    testLog(`Waiting for health check: ${url}, maxRetries: ${maxRetries}, intervalMs: ${intervalMs}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return;
        }
      } catch (error) {
        testLog(`Health check failed: ${url}, attempt: ${attempt}, error: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    testError(`Health check failed after ${maxRetries} attempts: ${url}`);
    throw new Error(`Health check failed after ${maxRetries} attempts: ${url}`);
  }
import dotenv from 'dotenv';
import { isAbsolute, resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Load environment variables in layers (shared keys first, then package-specific)
 * - shared keys are only loaded in node development mode
 */
export function loadEnv(projectRoot: string, packagePath: string): void {
    const sharedEnvPath = resolve(projectRoot, '.docker-keys/.env.generated');
    const packageEnvPath = resolve(packagePath, '.env');
  
    if (process.env.NODE_ENV !== 'production' && existsSync(sharedEnvPath)) {
      dotenv.config({ path: sharedEnvPath });
      // Resolve relative JWT paths to absolute paths based on project root
      // This handles cases where process.cwd() != project root (e.g., packages/backend/)
      if (process.env.JWT_PRIVATE_KEY_PATH && !isAbsolute(process.env.JWT_PRIVATE_KEY_PATH)) {
        process.env.JWT_PRIVATE_KEY_PATH = resolve(projectRoot, process.env.JWT_PRIVATE_KEY_PATH);
      }
      if (process.env.JWT_PUBLIC_KEY_PATH && !isAbsolute(process.env.JWT_PUBLIC_KEY_PATH)) {
        process.env.JWT_PUBLIC_KEY_PATH = resolve(projectRoot, process.env.JWT_PUBLIC_KEY_PATH);
      }
    }
  
    if (existsSync(packageEnvPath)) {
      dotenv.config({ path: packageEnvPath });
    }
  }
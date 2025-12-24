import * as path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import * as fs from 'fs-extra';

/**
 * GeneratorOrchestrator
 * 
 * Manages the spawning of NestJS CLI commands to generate modules, controllers,
 * services, and DTOs. This ensures structural compliance with NestJS conventions
 * while maintaining the ability to inject dynamic code.
 */

export interface OrchestratorConfig {
  projectRoot: string;
  config: {
    database: 'supabase' | 'gcloud-sql';
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
  };
}

export interface ModuleGenerationOptions {
  moduleName: string;
  modulePath: string; // e.g., 'modules/auth'
  generateController?: boolean;
  generateService?: boolean;
  generateDTOs?: string[]; // e.g., ['login.dto', 'register.dto']
}

/**
 * Orchestrate the generation of NestJS modules, controllers, services, and DTOs
 * using the host project's installed Nest CLI
 */
export async function orchestrateModuleGeneration(
  options: OrchestratorConfig & ModuleGenerationOptions
): Promise<void> {
  const { projectRoot, moduleName, modulePath, generateController = true, generateService = true, generateDTOs = [] } = options;

  try {
    // Step 1: Generate Module
    await runNestCommand(projectRoot, `g module ${modulePath}`);
    console.log(chalk.green(`✓ Module generated: ${modulePath}`));

    // Step 2: Generate Controller (optional)
    if (generateController) {
      await runNestCommand(projectRoot, `g controller ${modulePath}`);
      console.log(chalk.green(`✓ Controller generated: ${modulePath}`));
    }

    // Step 3: Generate Service (optional)
    if (generateService) {
      await runNestCommand(projectRoot, `g service ${modulePath}`);
      console.log(chalk.green(`✓ Service generated: ${modulePath}`));
    }

    // Step 4: Generate DTOs
    if (generateDTOs.length > 0) {
      const dtosPath = `${modulePath}/dto`;
      
      // Create DTO directory
      const dtoDirPath = path.join(projectRoot, 'src', dtosPath);
      await fs.ensureDir(dtoDirPath);

      for (const dtoName of generateDTOs) {
        const dtoNameWithoutExt = dtoName.replace('.ts', '').replace('.dto', '');
        await runNestCommand(projectRoot, `g class ${dtosPath}/${dtoNameWithoutExt}.dto --no-spec`);
        console.log(chalk.green(`✓ DTO generated: ${dtosPath}/${dtoNameWithoutExt}.dto`));
      }
    }

    console.log(chalk.cyan(`\n📦 ${moduleName} module generation complete\n`));
  } catch (error: any) {
    throw new Error(`Failed to generate ${moduleName} module: ${error.message}`);
  }
}

/**
 * Generate multiple modules sequentially
 */
export async function orchestrateMultipleModules(
  baseConfig: OrchestratorConfig,
  modules: ModuleGenerationOptions[]
): Promise<void> {
  console.log(chalk.cyan('\n🔧 Generating NestJS modules using Nest CLI...\n'));

  for (const module of modules) {
    try {
      await orchestrateModuleGeneration({
        ...baseConfig,
        ...module,
      });
    } catch (error: any) {
      console.error(chalk.red(`Error generating ${module.moduleName}:`), error.message);
      throw error;
    }
  }

  console.log(chalk.green('\n✅ All modules generated successfully!\n'));
}

/**
 * Run a NestJS CLI command
 * Uses the host project's installed Nest CLI
 */
function runNestCommand(projectRoot: string, command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Determine the correct nest command (nest or npx nest)
    const isWindows = process.platform === 'win32';
    const nestCommand = isWindows ? 'nest.cmd' : 'nest';

    const child = spawn(nestCommand, command.split(' '), {
      cwd: projectRoot,
      stdio: 'pipe', // Suppress output
      shell: true, // Use shell on Windows
    });

    let errorOutput = '';

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to execute nest command: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Nest CLI exited with code ${code}: ${errorOutput}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Alternative: Use npx nest for better compatibility
 */
function runNestCommandVianpmx(projectRoot: string, command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['nest', ...command.split(' ')], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    });

    let errorOutput = '';

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to execute npx nest command: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Nest CLI exited with code ${code}: ${errorOutput}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Check if Nest CLI is available
 */
export async function checkNestCliAvailability(projectRoot: string): Promise<boolean> {
  try {
    await runNestCommand(projectRoot, '--version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get installed Nest CLI version
 */
export async function getNestCliVersion(projectRoot: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['nest', '--version'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });

    child.on('error', () => {
      resolve(null);
    });
  });
}

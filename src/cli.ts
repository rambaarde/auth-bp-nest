#!/usr/bin/env node

import * as path from 'path';
import * as chalk from 'chalk';
import * as ora from 'ora';
import { promptConfig } from './prompts';
import { generateProjectStructure } from './generators/project.generator';

const getCurrentWorkingDirectory = () => process.cwd();

export async function runCLI(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 Auth Boilerplate - NestJS Backend\n'));
  console.log(chalk.blue('Initializing authentication setup...\n'));

  try {
    // Prompt user for configuration
    const config = await promptConfig();

    const spinner = ora('Generating project structure...').start();

    // Get project root (where npx command was run)
    const projectRoot = getCurrentWorkingDirectory();
    const templatesDir = path.join(__dirname, '..', 'templates');

    // Generate the project
    await generateProjectStructure({
      projectRoot,
      config,
      templatesDir,
    });

    spinner.succeed('Project structure generated successfully!');

    console.log(chalk.green('\n✅ Setup Complete!\n'));
    console.log(chalk.blue('📚 Documentation:'));
    console.log('  - Check .context.md files in each folder for detailed guidance');
    console.log('  - Review .auth-bp-config.json for your configuration');
    console.log('  - Copy .env.example to .env.local and fill in your credentials\n');

    console.log(chalk.yellow('⚠️  Configuration Summary:'));
    console.log(`  Database: ${config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL'}`);
    console.log(`  Whitelabel: ${config.whitelabel ? 'Enabled' : 'Disabled'}`);
    console.log(`  RBAC: ${config.rbac ? 'Enabled' : 'Disabled'}`);
    console.log(`  Multitenant: ${config.multitenant ? 'Enabled' : 'Disabled'}\n`);

    console.log(chalk.cyan('🚀 Next Steps:'));
    console.log('  1. npm install');
    console.log('  2. Configure .env.local with your database credentials');
    console.log('  3. npm run build');
    console.log('  4. npx prisma migrate dev');
    console.log('  5. npm run dev\n');
  } catch (error: any) {
    console.error(chalk.red('\n❌ Error during setup:'), error.message);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  runCLI();
}

import * as inquirer from 'inquirer';

export interface AuthBPConfig {
  database: 'supabase' | 'gcloud-sql';
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  databaseUrl?: string;
  jwtSecret?: string;
}

export async function promptConfig(): Promise<AuthBPConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Which database are you using?',
      choices: [
        { name: 'Supabase PostgreSQL', value: 'supabase' },
        { name: 'Google Cloud SQL PostgreSQL', value: 'gcloud-sql' },
      ],
      default: 'supabase',
    },
    {
      type: 'confirm',
      name: 'whitelabel',
      message: 'Enable Whitelabeling?',
      default: false,
      prefix: '❓',
    },
    {
      type: 'confirm',
      name: 'rbac',
      message: 'Enable RBAC (Role-Based Access Control)?',
      default: false,
      prefix: '❓',
    },
    {
      type: 'confirm',
      name: 'multitenant',
      message: 'Enable Multitenant support?',
      default: false,
      prefix: '❓',
    },
  ]);

  return answers as AuthBPConfig;
}

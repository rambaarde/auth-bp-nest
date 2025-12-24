import * as fs from 'fs-extra';
import * as path from 'path';

export interface AuthBPConfigFile {
  version: string;
  timestamp: string;
  backend: {
    framework: string;
    database: 'supabase' | 'gcloud-sql';
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
  };
}

export async function generateConfigFile(
  projectRoot: string,
  config: {
    database: 'supabase' | 'gcloud-sql';
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
  }
): Promise<void> {
  const configFile: AuthBPConfigFile = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    backend: {
      framework: 'nestjs',
      ...config,
    },
  };

  const configPath = path.join(projectRoot, '.auth-bp-config.json');
  await fs.writeJSON(configPath, configFile, { spaces: 2 });
}

export async function loadConfig(
  projectRoot: string
): Promise<AuthBPConfigFile | null> {
  const configPath = path.join(projectRoot, '.auth-bp-config.json');
  try {
    return await fs.readJSON(configPath);
  } catch {
    return null;
  }
}

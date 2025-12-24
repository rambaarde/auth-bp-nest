import * as fs from 'fs-extra';
import * as path from 'path';

export interface GeneratorOptions {
  projectRoot: string;
  config: {
    database: 'supabase' | 'gcloud-sql';
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
  };
  templatesDir: string;
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function copyTemplate(
  sourceDir: string,
  destDir: string
): Promise<void> {
  await fs.ensureDir(destDir);
  await fs.copy(sourceDir, destDir, { overwrite: true });
}

export function resolveTemplate(
  templatesDir: string,
  templateName: string
): string {
  return path.join(templatesDir, templateName);
}

export async function getTemplateContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

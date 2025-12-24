import * as path from 'path';
import * as fs from 'fs-extra';
import { writeFile, ensureDir } from '../utils/file-generator';
import { generateConfigFile } from './config.generator';
import * as chalk from 'chalk';
import {
  orchestrateMultipleModules,
  checkNestCliAvailability,
  getNestCliVersion,
} from './generator-orchestrator';
import {
  writeDTOFile,
  createLoginDTO,
  createRegisterDTO,
  createRefreshTokenDTO,
  createRoleDTO,
  createAssignRoleDTO,
  createTenantDTO,
  writeAuthDTOs,
  writeRBACDTOs,
  writeTenantDTOs,
} from './dto-writer';
import {
  generateAuthContextMD,
  generateRBACContextMD,
  generateTenantContextMD,
  generateRootContextMD,
} from './context-generator';

export interface ProjectGeneratorOptions {
  projectRoot: string;
  config: {
    database: 'supabase' | 'gcloud-sql';
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
  };
  templatesDir: string;
}

export async function generateProjectStructure(
  options: ProjectGeneratorOptions
): Promise<void> {
  const { projectRoot, config, templatesDir } = options;

  console.log(chalk.blue('\n📁 Generating project structure...\n'));

  // Create directory structure
  const srcDir = path.join(projectRoot, 'src');
  await ensureDir(srcDir);

  // Check Nest CLI availability
  console.log(chalk.cyan('🔍 Checking NestJS CLI availability...'));
  const hasNestCli = await checkNestCliAvailability(projectRoot);
  if (hasNestCli) {
    const version = await getNestCliVersion(projectRoot);
    console.log(chalk.green(`✓ Nest CLI v${version} found\n`));
  } else {
    console.log(chalk.yellow('⚠️  Nest CLI not found, using manual generation\n'));
  }

  // Generate base modules
  await generateAuthModule(projectRoot, config, templatesDir);
  await generateDatabaseModule(projectRoot, config, templatesDir);

  // Generate conditional modules
  if (config.rbac) {
    await generateRBACModule(projectRoot, config, templatesDir);
  }

  if (config.multitenant) {
    await generateTenantModule(projectRoot, config, templatesDir);
  }

  // Generate DTOs with validation decorators
  await generateDTOsWithValidation(projectRoot, config);

  // Generate .context.md files
  await generateContextFiles(projectRoot, config);

  // Generate configuration files
  await generateEnvTemplate(projectRoot, config);
  await generateConfigFile(projectRoot, config);

  console.log(chalk.green('✅ Project structure generated successfully!\n'));
  printGeneratedFiles(config);
}

/**
 * Generate DTOs with validation decorators
 * This integrates with the DTO Writer to create rich, validated DTOs
 */
async function generateDTOsWithValidation(
  projectRoot: string,
  config: any
): Promise<void> {
  console.log(chalk.cyan('\n📝 Generating Data Transfer Objects (DTOs)...\n'));

  // Auth DTOs
  await writeAuthDTOs(projectRoot, 'auth/dto', {
    whitelabel: config.whitelabel,
    rbac: config.rbac,
    multitenant: config.multitenant,
    database: config.database,
  });
  console.log(chalk.green('✓ Auth DTOs with validation decorators created'));

  // RBAC DTOs
  if (config.rbac) {
    await writeRBACDTOs(projectRoot, 'rbac/dto', {
      whitelabel: config.whitelabel,
      rbac: config.rbac,
      multitenant: config.multitenant,
      database: config.database,
    });
    console.log(chalk.green('✓ RBAC DTOs with validation decorators created'));
  }

  // Tenant DTOs
  if (config.multitenant) {
    await writeTenantDTOs(projectRoot, 'tenant/dto', {
      whitelabel: config.whitelabel,
      rbac: config.rbac,
      multitenant: config.multitenant,
      database: config.database,
    });
    console.log(chalk.green('✓ Tenant DTOs with validation decorators created'));
  }
}

/**
 * Generate .context.md files for AI agents
 * These provide AI-friendly documentation to prevent hallucinations
 */
async function generateContextFiles(
  projectRoot: string,
  config: any
): Promise<void> {
  console.log(chalk.cyan('\n📚 Generating AI Context Files (.context.md)...\n'));

  // Root context
  const rootContext = generateRootContextMD({
    whitelabel: config.whitelabel,
    rbac: config.rbac,
    multitenant: config.multitenant,
    database: config.database,
  });
  await writeFile(path.join(projectRoot, 'src', '.context.md'), rootContext);
  console.log(chalk.green('✓ Root context file created: src/.context.md'));

  // Auth module context
  const authContext = generateAuthContextMD({
    whitelabel: config.whitelabel,
    rbac: config.rbac,
    multitenant: config.multitenant,
    database: config.database,
  });
  await writeFile(path.join(projectRoot, 'src', 'auth', '.context.md'), authContext);
  console.log(chalk.green('✓ Auth module context created: src/auth/.context.md'));

  // RBAC module context
  if (config.rbac) {
    const rbacContext = generateRBACContextMD({
      whitelabel: config.whitelabel,
      rbac: config.rbac,
      multitenant: config.multitenant,
      database: config.database,
    });
    await writeFile(path.join(projectRoot, 'src', 'rbac', '.context.md'), rbacContext);
    console.log(chalk.green('✓ RBAC module context created: src/rbac/.context.md'));
  }

  // Tenant module context
  if (config.multitenant) {
    const tenantContext = generateTenantContextMD({
      whitelabel: config.whitelabel,
      rbac: config.rbac,
      multitenant: config.multitenant,
      database: config.database,
    });
    await writeFile(path.join(projectRoot, 'src', 'tenant', '.context.md'), tenantContext);
    console.log(chalk.green('✓ Tenant module context created: src/tenant/.context.md'));
  }
}

async function generateAuthModule(
  projectRoot: string,
  config: any,
  templatesDir: string
): Promise<void> {
  const authDir = path.join(projectRoot, 'src', 'auth');
  await ensureDir(authDir);

  // Create auth module files
  const files = [
    { name: 'jwt.service.ts', template: 'auth/jwt.service.ts' },
    { name: 'auth.guard.ts', template: 'auth/auth.guard.ts' },
    { name: 'auth.controller.ts', template: 'auth/auth.controller.ts' },
    { name: 'auth.module.ts', template: 'auth/auth.module.ts' },
    { name: 'auth.service.ts', template: 'auth/auth.service.ts' },
  ];

  for (const file of files) {
    const templatePath = path.join(templatesDir, file.template);
    let content = '';

    try {
      content = await fs.readFile(templatePath, 'utf-8');
    } catch {
      content = generateDefaultContent(file.name, 'auth', config);
    }

    await writeFile(path.join(authDir, file.name), content);
  }

  // Create strategies subdirectory
  const strategiesDir = path.join(authDir, 'strategies');
  await ensureDir(strategiesDir);
  await writeFile(
    path.join(strategiesDir, 'jwt.strategy.ts'),
    generateJWTStrategy(config)
  );

  // Create DTOs subdirectory (DTOs will be generated by generateDTOsWithValidation)
  const dtosDir = path.join(authDir, 'dto');
  await ensureDir(dtosDir);
}

async function generateDatabaseModule(
  projectRoot: string,
  config: any,
  templatesDir: string
): Promise<void> {
  const dbDir = path.join(projectRoot, 'src', 'database');
  await ensureDir(dbDir);

  // Create database module files
  await writeFile(
    path.join(dbDir, 'schema.prisma'),
    generatePrismaSchema(config)
  );

  // Create entities subdirectory
  const entitiesDir = path.join(dbDir, 'entities');
  await ensureDir(entitiesDir);
  await writeFile(
    path.join(entitiesDir, 'user.entity.ts'),
    generateUserEntity(config)
  );

  // Create migrations subdirectory
  const migrationsDir = path.join(dbDir, 'migrations');
  await ensureDir(migrationsDir);
}

async function generateRBACModule(
  projectRoot: string,
  config: any,
  templatesDir: string
): Promise<void> {
  const rbacDir = path.join(projectRoot, 'src', 'rbac');
  await ensureDir(rbacDir);

  await writeFile(
    path.join(rbacDir, 'rbac.guard.ts'),
    generateRBACGuard(config)
  );
  await writeFile(
    path.join(rbacDir, 'rbac.service.ts'),
    generateRBACService(config)
  );
  await writeFile(
    path.join(rbacDir, 'roles.decorator.ts'),
    generateRolesDecorator(config)
  );
  await writeFile(
    path.join(rbacDir, 'permissions.decorator.ts'),
    generatePermissionsDecorator(config)
  );

  // Create entities subdirectory
  const entitiesDir = path.join(rbacDir, 'entities');
  await ensureDir(entitiesDir);
  await writeFile(
    path.join(entitiesDir, 'role.entity.ts'),
    generateRoleEntity(config)
  );
  await writeFile(
    path.join(entitiesDir, 'permission.entity.ts'),
    generatePermissionEntity(config)
  );

  // Create DTOs subdirectory
  const dtosDir = path.join(rbacDir, 'dto');
  await ensureDir(dtosDir);
}

async function generateTenantModule(
  projectRoot: string,
  config: any,
  templatesDir: string
): Promise<void> {
  const tenantDir = path.join(projectRoot, 'src', 'tenant');
  await ensureDir(tenantDir);

  await writeFile(
    path.join(tenantDir, 'tenant.middleware.ts'),
    generateTenantMiddleware(config)
  );
  await writeFile(
    path.join(tenantDir, 'tenant.service.ts'),
    generateTenantService(config)
  );
  await writeFile(
    path.join(tenantDir, 'tenant.decorator.ts'),
    generateTenantDecorator(config)
  );

  // Create entities subdirectory
  const entitiesDir = path.join(tenantDir, 'entities');
  await ensureDir(entitiesDir);
  await writeFile(
    path.join(entitiesDir, 'tenant.entity.ts'),
    generateTenantEntity(config)
  );

  // Create DTOs subdirectory
  const dtosDir = path.join(tenantDir, 'dto');
  await ensureDir(dtosDir);
}

async function generateEnvTemplate(
  projectRoot: string,
  config: any
): Promise<void> {
  let envContent = `# Database Configuration
`;

  if (config.database === 'supabase') {
    envContent += `SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
`;
  } else {
    envContent += `DATABASE_URL=postgresql://user:password@cloudsql-instance:5432/auth_db
`;
  }

  envContent += `
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=3600

# Application
NODE_ENV=development
PORT=3001
`;

  await writeFile(path.join(projectRoot, '.env.example'), envContent);
}

function generateDefaultContent(
  fileName: string,
  moduleName: string,
  config: any
): string {
  return `// ${moduleName}/${fileName}\n// Auto-generated by auth-bp-nest`;
}

function generateJWTStrategy(config: any): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      ${config.rbac ? 'roles: payload.roles,' : ''}
      ${config.multitenant ? 'tenantId: payload.tenant_id,' : ''}
    };
  }
}
`;
}

function generateUserEntity(config: any): string {
  return `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  ${config.multitenant ? "@Column({ nullable: true, type: 'uuid' })\n  tenantId: string;" : ''}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;
}

function generateRoleEntity(config: any): string {
  return `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  ${config.multitenant ? "@Column({ nullable: true, type: 'uuid' })\n  tenantId: string;" : ''}
}
`;
}

function generatePermissionEntity(config: any): string {
  return `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}
`;
}

function generateTenantEntity(config: any): string {
  return `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ default: false })
  isWhitelabel: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
`;
}

function generateRBACGuard(config: any): string {
  return `import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('No roles assigned');
    }

    const hasRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
`;
}

function generateRBACService(config: any): string {
  return `import { Injectable } from '@nestjs/common';

@Injectable()
export class RbacService {
  async createRole(name: string, description?: string) {
    // Implementation
  }

  async assignRoleToUser(userId: string, roleId: string) {
    // Implementation
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    // Implementation
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    // Implementation
  }
}
`;
}

function generateRolesDecorator(config: any): string {
  return `import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
`;
}

function generatePermissionsDecorator(config: any): string {
  return `import { SetMetadata } from '@nestjs/common';

export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);
`;
}

function generateTenantMiddleware(config: any): string {
  return `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (tenantId) {
      req['tenantId'] = tenantId;
    }
    next();
  }
}
`;
}

function generateTenantService(config: any): string {
  return `import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantService {
  async getTenant(tenantId: string) {
    // Implementation
  }

  async createTenant(name: string, slug: string) {
    // Implementation
  }

  async addUserToTenant(userId: string, tenantId: string) {
    // Implementation
  }
}
`;
}

function generateTenantDecorator(config: any): string {
  return `import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.user?.tenantId;
  },
);
`;
}

function generatePrismaSchema(config: any): string {
  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${config.database === 'supabase' ? 'postgresql' : 'postgresql'}"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  passwordHash String
  firstName String?
  lastName  String?
  ${config.multitenant ? 'tenantId  String?\n  tenant    Tenant?   @relation(fields: [tenantId], references: [id])' : ''}
  ${config.rbac ? 'roles     UserRole[]' : ''}
  sessions  Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@map("sessions")
}

${
  config.rbac
    ? `model Role {
  id          String   @id @default(cuid())
  name        String
  description String?
  ${config.multitenant ? 'tenantId    String?\n  tenant      Tenant?   @relation(fields: [tenantId], references: [id])' : ''}
  permissions RolePermission[]
  users       UserRole[]
  createdAt   DateTime @default(now())

  @@unique([name${config.multitenant ? ', tenantId' : ''}])
  @@map("roles")
}

model Permission {
  id          String   @id @default(cuid())
  name        String
  description String?
  roles       RolePermission[]
  createdAt   DateTime @default(now())

  @@map("permissions")
}

model UserRole {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId String
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}
`
    : ''
}${
  config.multitenant
    ? `model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  domain      String?
  isWhitelabel Boolean @default(false)
  users       User[]
  ${config.rbac ? 'roles       Role[]' : ''}
  createdAt   DateTime @default(now())

  @@map("tenants")
}
`
    : ''
}
`;
}

function printGeneratedFiles(config: any): void {
  console.log(chalk.blue('📁 Generated files:\n'));
  console.log(chalk.green('  ✓ src/auth/'));
  console.log(chalk.green('  ✓ src/auth/dto/ (with validation decorators)'));
  console.log(chalk.green('  ✓ src/auth/.context.md (AI-friendly documentation)'));
  console.log(chalk.green('  ✓ src/database/'));
  if (config.rbac) {
    console.log(chalk.green('  ✓ src/rbac/'));
    console.log(chalk.green('  ✓ src/rbac/dto/ (with validation decorators)'));
    console.log(chalk.green('  ✓ src/rbac/.context.md (AI-friendly documentation)'));
  }
  if (config.multitenant) {
    console.log(chalk.green('  ✓ src/tenant/'));
    console.log(chalk.green('  ✓ src/tenant/dto/ (with validation decorators)'));
    console.log(chalk.green('  ✓ src/tenant/.context.md (AI-friendly documentation)'));
  }
  console.log(chalk.green('  ✓ .env.example'));
  console.log(chalk.green('  ✓ .auth-bp-config.json'));
  console.log(chalk.blue('\n📚 Next steps:'));
  console.log('  1. Review .context.md files and .env.example');
  console.log('  2. Install dependencies: npm install');
  console.log('  3. Setup database: npx prisma migrate dev');
  console.log('  4. Start development: npm run dev\n');
}

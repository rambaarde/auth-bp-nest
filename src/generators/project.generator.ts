import * as path from 'path';
import * as fs from 'fs-extra';
import { writeFile, ensureDir } from '../utils/file-generator';
import { generateConfigFile } from './config.generator';
import * as chalk from 'chalk';

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

  // Generate configuration files
  await generateEnvTemplate(projectRoot, config);
  await generateConfigFile(projectRoot, config);

  // Generate root context
  await generateRootContext(projectRoot, config);

  console.log(chalk.green('✅ Project structure generated successfully!\n'));
  printGeneratedFiles(config);
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
    { name: '.context.md', template: 'auth/.context.md' },
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
    path.join(strategiesDir, '.context.md'),
    generateContextFile('Strategies', 'JWT and other authentication strategies', config)
  );
  await writeFile(
    path.join(strategiesDir, 'jwt.strategy.ts'),
    generateJWTStrategy(config)
  );

  // Create DTOs subdirectory
  const dtosDir = path.join(authDir, 'dtos');
  await ensureDir(dtosDir);
  await writeFile(
    path.join(dtosDir, '.context.md'),
    generateContextFile('DTOs', 'Data transfer objects for authentication', config)
  );
  await writeFile(
    path.join(dtosDir, 'login.dto.ts'),
    generateLoginDTO(config)
  );
  await writeFile(
    path.join(dtosDir, 'signup.dto.ts'),
    generateSignupDTO(config)
  );
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
    path.join(dbDir, '.context.md'),
    generateDatabaseContext(config)
  );
  await writeFile(
    path.join(dbDir, 'schema.prisma'),
    generatePrismaSchema(config)
  );

  // Create entities subdirectory
  const entitiesDir = path.join(dbDir, 'entities');
  await ensureDir(entitiesDir);
  await writeFile(
    path.join(entitiesDir, '.context.md'),
    generateContextFile('Entities', 'TypeORM/Prisma entity definitions', config)
  );
  await writeFile(
    path.join(entitiesDir, 'user.entity.ts'),
    generateUserEntity(config)
  );

  // Create migrations subdirectory
  const migrationsDir = path.join(dbDir, 'migrations');
  await ensureDir(migrationsDir);
  await writeFile(
    path.join(migrationsDir, '.context.md'),
    generateContextFile('Migrations', 'Database migration files', config)
  );
}

async function generateRBACModule(
  projectRoot: string,
  config: any,
  templatesDir: string
): Promise<void> {
  const rbacDir = path.join(projectRoot, 'src', 'rbac');
  await ensureDir(rbacDir);

  await writeFile(
    path.join(rbacDir, '.context.md'),
    generateRBACContext(config)
  );
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
    path.join(entitiesDir, '.context.md'),
    generateContextFile('RBAC Entities', 'Role and Permission entities', config)
  );
  await writeFile(
    path.join(entitiesDir, 'role.entity.ts'),
    generateRoleEntity(config)
  );
  await writeFile(
    path.join(entitiesDir, 'permission.entity.ts'),
    generatePermissionEntity(config)
  );
}

async function generateTenantModule(
  projectRoot: string,
  config: any,
  templatesDir: string
): Promise<void> {
  const tenantDir = path.join(projectRoot, 'src', 'tenant');
  await ensureDir(tenantDir);

  await writeFile(
    path.join(tenantDir, '.context.md'),
    generateTenantContext(config)
  );
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
    path.join(entitiesDir, '.context.md'),
    generateContextFile('Tenant Entities', 'Tenant entity definitions', config)
  );
  await writeFile(
    path.join(entitiesDir, 'tenant.entity.ts'),
    generateTenantEntity(config)
  );
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

async function generateRootContext(
  projectRoot: string,
  config: any
): Promise<void> {
  const contextContent = `# Authentication Boilerplate - NestJS Backend

## Project Overview
This is an authentication boilerplate for NestJS with support for JWT-based authentication, optional RBAC, and optional multitenant architecture.

## Configuration Applied
- **Database**: ${config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL PostgreSQL'}
- **Whitelabel**: ${config.whitelabel ? 'Enabled' : 'Disabled'}
- **RBAC**: ${config.rbac ? 'Enabled' : 'Disabled'}
- **Multitenant**: ${config.multitenant ? 'Enabled' : 'Disabled'}

## Folder Structure

### Core Modules
- **src/auth/**: Authentication logic (JWT, guards, controllers)
  - See [auth/.context.md](./auth/.context.md) for details
- **src/database/**: Database setup, entities, and migrations
  - See [database/.context.md](./database/.context.md) for details

${config.rbac ? '- **src/rbac/**: Role-based access control\n  - See [rbac/.context.md](./rbac/.context.md) for details\n' : ''}${config.multitenant ? '- **src/tenant/**: Multitenant support\n  - See [tenant/.context.md](./tenant/.context.md) for details\n' : ''}
## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Setup environment variables:
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   \`\`\`

3. Run migrations:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- \`POST /auth/signup\` - Register new user
- \`POST /auth/login\` - Login user
- \`POST /auth/refresh\` - Refresh JWT token
- \`POST /auth/logout\` - Logout user

${config.rbac ? `### RBAC
- \`GET /rbac/roles\` - Get all roles
- \`POST /rbac/roles\` - Create new role
- \`GET /rbac/permissions\` - Get all permissions
` : ''}${config.multitenant ? `### Tenant
- \`GET /tenant\` - Get current tenant
- \`POST /tenant\` - Create new tenant
` : ''}
## Key Modules

Each folder has a \`.context.md\` file with detailed information about:
- Purpose and responsibilities
- How to extend and customize
- Related modules and dependencies
- Common tasks and examples

## Integration with Frontend

This backend works seamlessly with \`@auth-bp-next\` frontend package. Make sure both are configured with matching options:
- Whitelabel: ${config.whitelabel}
- RBAC: ${config.rbac}
- Multitenant: ${config.multitenant}

## Environment Variables

See \`.env.example\` for all required environment variables.

## Database Support

${config.database === 'supabase' ? `### Supabase
Uses Supabase PostgreSQL with Prisma ORM.

Connection string format:
\`postgresql://postgres:[password]@db.supabase.co:5432/postgres\`

Prisma will handle migrations automatically.
` : `### Google Cloud SQL
Uses Google Cloud SQL PostgreSQL with Prisma ORM.

Connection string format:
\`postgresql://[user]:[password]@[instance-connection-name]:5432/[database]\`

Make sure Cloud SQL Auth proxy is running.
`}
`;

  await writeFile(path.join(projectRoot, 'src', '.context.md'), contextContent);
}

function generateDefaultContent(
  fileName: string,
  moduleName: string,
  config: any
): string {
  if (fileName === '.context.md') {
    return generateContextFile(
      moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
      `${moduleName} module context`,
      config
    );
  }
  return `// ${moduleName}/${fileName}\n// Auto-generated by auth-bp-nest`;
}

function generateContextFile(
  title: string,
  description: string,
  config: any
): string {
  return `# ${title}

## Purpose
${description}

## Configuration Applied
- Whitelabel: ${config.whitelabel}
- RBAC: ${config.rbac}
- Multitenant: ${config.multitenant}

## Files in This Module
<!-- List your files here -->

## Key Concepts
<!-- Explain key concepts -->

## Integration Points
<!-- Describe how this module integrates with others -->

## Common Tasks
<!-- List common modification tasks -->
`;
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

function generateLoginDTO(config: any): string {
  return `export class LoginDto {
  email: string;
  password: string;
}
`;
}

function generateSignupDTO(config: any): string {
  return `export class SignupDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

  ${config.multitenant ? '@Column({ nullable: true, type: \'uuid\' })\n  tenantId: string;' : ''}

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

  ${config.multitenant ? '@Column({ nullable: true, type: \'uuid\' })\n  tenantId: string;' : ''}
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

function generateRBACContext(config: any): string {
  return generateContextFile(
    'RBAC Module',
    'Role-Based Access Control implementation for fine-grained access management',
    config
  );
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

function generateTenantContext(config: any): string {
  return generateContextFile(
    'Tenant Module',
    'Multitenant support with isolated data access and tenant management',
    config
  );
}

function generateDatabaseContext(config: any): string {
  return `# Database Module Context

## Purpose
PostgreSQL database connection, migrations, and ORM setup using Prisma.

## Database Support
${config.database === 'supabase' ? `### Supabase PostgreSQL
Optimized for Supabase with automatic connection pooling.

Connection format: \`postgresql://postgres:[password]@db.supabase.co:5432/postgres\`
` : `### Google Cloud SQL PostgreSQL
Configured for Google Cloud SQL with Cloud SQL Auth proxy support.

Connection format: \`postgresql://[user]:[password]@cloudsql-instance:5432/database\`
`}

## Schema Overview

### Core Tables
- \`users\`: User accounts and credentials
- \`sessions\`: Active sessions with refresh tokens

${config.rbac ? `### RBAC Tables
- \`roles\`: Role definitions
- \`permissions\`: Permission definitions
- \`user_roles\`: User-role assignments
- \`role_permissions\`: Role-permission assignments
` : ''}${config.multitenant ? `### Multitenant Tables
- \`tenants\`: Tenant definitions
- \`tenant_users\`: Tenant-user associations
${config.rbac ? '- \`tenant_roles\`: Tenant-scoped roles' : ''}
` : ''}
## Running Migrations

\`\`\`bash
npx prisma migrate dev --name <migration_name>
npx prisma db push  # Sync schema without migration
\`\`\`

## Seeding Database

Create a \`prisma/seed.ts\` file for initial data.

## Related Modules
- Auth Module (\`../auth/.context.md\`)
- RBAC Module (\`../rbac/.context.md\` if enabled)
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

${config.rbac ? `model Role {
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
` : ''}${config.multitenant ? `model Tenant {
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
` : ''}
`;
}

function printGeneratedFiles(config: any): void {
  console.log(chalk.blue('📁 Generated files:\n'));
  console.log(chalk.green('  ✓ src/auth/'));
  console.log(chalk.green('  ✓ src/database/'));
  if (config.rbac) {
    console.log(chalk.green('  ✓ src/rbac/'));
  }
  if (config.multitenant) {
    console.log(chalk.green('  ✓ src/tenant/'));
  }
  console.log(chalk.green('  ✓ .env.example'));
  console.log(chalk.green('  ✓ .auth-bp-config.json'));
  console.log(chalk.blue('\n📚 Next steps:'));
  console.log('  1. Review .env.example and create .env.local');
  console.log('  2. Install dependencies: npm install');
  console.log('  3. Setup database: npx prisma migrate dev');
  console.log('  4. Check .context.md files in each folder');
  console.log('  5. Start development: npm run dev\n');
}

/**
 * ContextGenerator
 * 
 * Generates `.context.md` files that serve as "readme for AI agents" (Copilot, Cursor, etc).
 * These files provide detailed context about DTOs, validation rules, architecture,
 * and integration points to prevent AI hallucinations.
 */

export interface AuthBPContextConfig {
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  database: 'supabase' | 'gcloud-sql';
}

/**
 * Generate .context.md for Auth Module
 */
export function generateAuthContextMD(config: AuthBPContextConfig): string {
  const lines: string[] = [];

  lines.push('# Auth Module Context\n');
  lines.push('## Module Purpose');
  lines.push('This module handles all authentication logic including:');
  lines.push('- User registration and login');
  lines.push('- JWT token generation and validation');
  lines.push('- Refresh token management');
  lines.push('- Password hashing and verification\n');

  lines.push('## Architecture Overview\n');

  if (config.multitenant) {
    lines.push('### Multitenant-Aware Authentication');
    lines.push('- All login requests are validated against the current tenant context');
    lines.push('- User-tenant association is enforced at the database level');
    lines.push('- JWT tokens include tenant identifier for request routing\n');
  } else {
    lines.push('### Single-Tenant Authentication');
    lines.push('- Standard JWT-based authentication flow');
    lines.push('- No tenant isolation in this deployment\n');
  }

  if (config.rbac) {
    lines.push('### Role-Based Access Control Integration');
    lines.push('- User roles are included in JWT payload');
    lines.push('- Guards check role-based permissions on protected routes');
    lines.push('- Roles are tenant-scoped if multitenant is enabled\n');
  } else {
    lines.push('### Simple Access Control');
    lines.push('- Basic authenticated vs. unauthenticated access');
    lines.push('- No role-based permission system\n');
  }

  lines.push('## Data Transfer Objects (DTOs)\n');
  lines.push('All DTOs use class-validator for strict validation.');
  lines.push('The ValidationPipe is configured globally.\n');

  lines.push('### LoginDto');
  lines.push('Purpose: User login with email and password\n');
  lines.push('Properties:');
  lines.push('- email (string, email): Valid email address [IsEmail, IsDefined]');
  lines.push('- password (string): User password, min 8 chars [IsString, MinLength(8)]');
  if (config.multitenant) {
    lines.push('- tenantId (string, optional): Tenant identifier [IsUUID, IsOptional]');
  }
  lines.push('');

  lines.push('### RegisterDto');
  lines.push('Purpose: User registration with profile data\n');
  lines.push('Properties:');
  lines.push('- email (string, email): Unique email address [IsEmail, IsDefined]');
  lines.push('- password (string): Strong password, min 8 chars [IsStrongPassword, MinLength(8)]');
  lines.push('- firstName (string): First name [IsString, MinLength(2), MaxLength(50)]');
  lines.push('- lastName (string): Last name [IsString, MinLength(2), MaxLength(50)]');
  if (config.whitelabel) {
    lines.push('- brandId (string, optional): Brand identifier [IsUUID, IsOptional]');
    lines.push('- theme (string, optional): Theme preference [IsString, IsOptional]');
  }
  if (config.multitenant) {
    lines.push('- tenantId (string, optional): Tenant identifier [IsUUID, IsOptional]');
  }
  lines.push('');

  lines.push('### RefreshTokenDto');
  lines.push('Purpose: Request new JWT token using refresh token\n');
  lines.push('Properties:');
  lines.push('- refreshToken (string): Valid refresh token [IsString, IsDefined]\n');

  lines.push('## Validation Rules\n');
  lines.push('### Email Validation');
  lines.push('- Must be valid email format (RFC 5322)');
  lines.push('- Must be unique in users table');
  lines.push('- Checked by @IsEmail() decorator + database unique constraint\n');

  lines.push('### Password Validation');
  lines.push('- Minimum 8 characters');
  lines.push('- Must contain uppercase letters (A-Z)');
  lines.push('- Must contain lowercase letters (a-z)');
  lines.push('- Must contain numbers (0-9)');
  lines.push('- Must contain special characters (!@#$%^&*)');
  lines.push('- Enforced by @IsStrongPassword() decorator');
  lines.push('- Always hash before storing (bcryptjs)\n');

  lines.push('## Integration Points\n');
  lines.push('### Dependencies');
  lines.push('- @nestjs/jwt - JWT token generation');
  lines.push('- @nestjs/passport - Strategy-based authentication');
  lines.push('- passport-jwt - JWT passport strategy');
  lines.push('- class-validator - DTO validation');
  lines.push('- class-transformer - DTO transformation');
  lines.push('- bcryptjs - Password hashing\n');

  lines.push('### Exports');
  lines.push('- AuthService - Core authentication logic');
  lines.push('- JwtStrategy - JWT passport strategy');
  lines.push('- AuthGuard - JWT authentication guard');
  if (config.rbac) {
    lines.push('- RbacGuard - Role-based access guard');
    lines.push('- Roles decorator - Mark routes with required roles');
  }
  lines.push('');

  lines.push('## Security Considerations\n');
  lines.push('- Never return password hash in responses');
  lines.push('- Always validate strong passwords on registration');
  lines.push('- Use bcryptjs with salt rounds >= 10');
  lines.push('- Implement password reset flow separately');
  lines.push('- Store refresh tokens in database for revocation');
  lines.push('- Validate token expiration on every request\n');

  lines.push('## Configuration Applied');
  lines.push(`- Whitelabel: ${config.whitelabel}`);
  lines.push(`- RBAC: ${config.rbac}`);
  lines.push(`- Multitenant: ${config.multitenant}`);
  lines.push(`- Database: ${config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL'}`);

  return lines.join('\n');
}

/**
 * Generate .context.md for RBAC Module
 */
export function generateRBACContextMD(config: AuthBPContextConfig): string {
  if (!config.rbac) {
    return '';
  }

  const lines: string[] = [];

  lines.push('# RBAC (Role-Based Access Control) Module Context\n');
  lines.push('## Module Purpose');
  lines.push('Implements fine-grained access control through roles and permissions:');
  lines.push('- Define roles (Admin, User, Moderator, etc.)');
  lines.push('- Assign permissions to roles (create:post, read:post, delete:post, etc.)');
  lines.push('- Assign roles to users');
  lines.push('- Enforce permissions on protected routes\n');

  lines.push('## Architecture\n');
  lines.push('### Three-Tier Permission Model');
  lines.push('1. User can have multiple Roles');
  lines.push('2. Role can have multiple Permissions');
  lines.push('3. Permission defines what can be done (create, read, update, delete)\n');

  lines.push('## Data Transfer Objects (DTOs)\n');
  lines.push('### CreateRoleDto');
  lines.push('- name (string): Role name, min 3 chars [IsString, MinLength(3), IsDefined]');
  lines.push('- description (string, optional): Role description [IsString, IsOptional]');
  lines.push('- permissions (array, optional): Permission IDs to assign [IsOptional]');
  if (config.multitenant) {
    lines.push('- tenantId (string, optional): Tenant ID if multitenant [IsUUID, IsOptional]');
  }
  lines.push('');

  lines.push('### AssignRoleDto');
  lines.push('- userId (string): User ID [IsUUID, IsDefined]');
  lines.push('- roleId (string): Role ID [IsUUID, IsDefined]\n');

  lines.push('## Decorators\n');
  lines.push('### @Roles(...roles: string[])');
  lines.push('Use on controller methods to restrict access by role.\n');

  lines.push('## JWT Payload Integration\n');
  lines.push('When RBAC is enabled, JWT tokens include roles:');
  lines.push('- sub: user-id');
  lines.push('- email: user@example.com');
  lines.push('- roles: [user, moderator]');
  if (config.multitenant) {
    lines.push('- tenantId: tenant-id');
  }
  lines.push('- iat: 1234567890');
  lines.push('- exp: 1234571490\n');

  lines.push('## Security Best Practices\n');
  lines.push('1. Always validate roles on protected routes');
  lines.push('2. Assign minimum required roles (Principle of Least Privilege)');
  lines.push('3. Log role assignments and changes (Audit Logging)');
  lines.push('4. Separate operational and administrative roles');
  lines.push('5. Default deny - deny access unless explicitly allowed\n');

  lines.push('## Configuration Applied');
  lines.push(`- Whitelabel: ${config.whitelabel}`);
  lines.push(`- RBAC: Enabled`);
  lines.push(`- Multitenant: ${config.multitenant}`);

  return lines.join('\n');
}

/**
 * Generate .context.md for Tenant Module
 */
export function generateTenantContextMD(config: AuthBPContextConfig): string {
  if (!config.multitenant) {
    return '';
  }

  const lines: string[] = [];

  lines.push('# Tenant Module Context (Multitenant Architecture)\n');
  lines.push('## Module Purpose');
  lines.push('Manages tenant isolation and multitenancy:');
  lines.push('- Create and manage separate tenants (customers/organizations)');
  lines.push('- Isolate user data per tenant');
  lines.push('- Support whitelabel branding per tenant');
  lines.push('- Handle tenant-specific database queries\n');

  lines.push('## Multitenancy Strategy\n');
  lines.push('### Database-Level Isolation');
  lines.push('Every table has a tenantId column (except global tables):');
  lines.push('- Users are scoped to tenants');
  lines.push('- Roles, permissions scoped to tenants');
  lines.push('- All queries filtered by WHERE tenantId = ?\n');

  lines.push('### Request-Level Isolation');
  lines.push('Tenant ID extracted from:');
  lines.push('1. JWT token (tenantId claim)');
  lines.push('2. Request header (X-Tenant-ID)');
  lines.push('3. Request subdomain (if whitelabel domain routing)\n');

  lines.push('## Data Transfer Objects (DTOs)\n');
  lines.push('### CreateTenantDto');
  lines.push('- name (string): Tenant display name, 2-100 chars [IsString, IsDefined]');
  lines.push('- slug (string): URL-friendly identifier [IsString, Matches(/^[a-z0-9-]+$/), IsDefined]');
  lines.push('- domain (string, optional): Custom domain for whitelabel [IsString, IsOptional]');
  if (config.whitelabel) {
    lines.push('- isWhitelabel (boolean, optional): Enable whitelabel mode [IsOptional]');
  }
  lines.push('');

  lines.push('## CRITICAL: Data Isolation Rules\n');
  lines.push('WRONG - This queries all users, violates tenant isolation:');
  lines.push('const users = await db.user.findMany();\n');
  lines.push('CORRECT - Always filter by tenantId:');
  lines.push('const users = await db.user.findMany({');
  lines.push('  where: { tenantId: currentTenantId }');
  lines.push('});\n');

  lines.push('## Security Best Practices\n');
  lines.push('1. ALWAYS include tenantId in WHERE clauses');
  lines.push('2. NEVER query data without tenant filtering');
  lines.push('3. Validate tenant ownership before operations');
  lines.push('4. Keep JWT tenantId in sync with actual associations');
  lines.push('5. Test cross-tenant access is properly blocked');
  if (config.whitelabel) {
    lines.push('6. Verify domain-to-tenant mapping for whitelabel');
  }
  lines.push('');

  lines.push('## Configuration Applied');
  lines.push(`- Whitelabel: ${config.whitelabel}`);
  lines.push(`- RBAC: ${config.rbac}`);
  lines.push(`- Multitenant: Enabled`);
  lines.push(`- Database: ${config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL'}`);

  return lines.join('\n');
}

/**
 * Generate root .context.md for entire project
 */
export function generateRootContextMD(config: AuthBPContextConfig): string {
  const lines: string[] = [];

  lines.push('# Authentication Boilerplate - NestJS Backend\n');
  lines.push('## Project Overview');
  lines.push('This is a production-ready authentication system scaffolded by auth-bp-nest CLI.\n');
  lines.push('## Configuration Summary\n');
  lines.push('Whitelabel: ' + config.whitelabel);
  lines.push('RBAC: ' + config.rbac);
  lines.push('Multitenant: ' + config.multitenant);
  lines.push('Database: ' + (config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL') + '\n');

  lines.push('## Module Structure\n');
  lines.push('- src/auth/ - Authentication logic (JWT, guards, controllers)');
  lines.push('- src/database/ - Database setup, entities, and migrations');
  if (config.rbac) {
    lines.push('- src/rbac/ - Role-based access control');
  }
  if (config.multitenant) {
    lines.push('- src/tenant/ - Multitenant management');
  }
  lines.push('');

  lines.push('## Getting Started\n');
  lines.push('1. npm install');
  lines.push('2. cp .env.example .env.local');
  lines.push('3. Configure .env.local with database credentials');
  lines.push('4. npx prisma migrate dev');
  lines.push('5. npm run dev\n');

  lines.push('## Key Concepts\n');
  lines.push('### JWT Token Structure');
  lines.push('- sub: user-id');
  lines.push('- email: user@example.com');
  if (config.rbac) {
    lines.push('- roles: [user, admin]');
  }
  if (config.multitenant) {
    lines.push('- tenantId: tenant-id');
  }
  lines.push('- iat: issued-at');
  lines.push('- exp: expiration\n');

  lines.push('### Request Authentication');
  lines.push('All protected endpoints require Bearer token:');
  lines.push('Authorization: Bearer <access-token>\n');

  if (config.multitenant) {
    lines.push('### Tenant Identification');
    lines.push('Specify tenant via:');
    lines.push('1. JWT claim (preferred) - automatically from login');
    lines.push('2. Header - X-Tenant-ID: <tenant-id>');
    if (config.whitelabel) {
      lines.push('3. Subdomain - acme.example.com routes to tenant with slug "acme"');
    }
    lines.push('');
  }

  lines.push('## Data Validation\n');
  lines.push('All request bodies are validated using DTOs with class-validator.');
  lines.push('Invalid requests return 400 with error details.\n');

  lines.push('## Security Features\n');
  lines.push('- Password hashing with bcrypt (salt rounds >= 10)');
  lines.push('- JWT signing with secret key');
  lines.push('- Short-lived access tokens + refresh token rotation');
  lines.push('- Strict DTO validation (SQL injection prevention)');
  if (config.rbac) {
    lines.push('- Role-based route protection');
  }
  if (config.multitenant) {
    lines.push('- Tenant-scoped database queries');
    lines.push('- Cross-tenant access prevention');
  }
  lines.push('');

  lines.push('## See Also\n');
  lines.push('- src/auth/.context.md - Authentication module details');
  if (config.rbac) {
    lines.push('- src/rbac/.context.md - RBAC implementation');
  }
  if (config.multitenant) {
    lines.push('- src/tenant/.context.md - Multitenancy patterns');
  }

  return lines.join('\n');
}

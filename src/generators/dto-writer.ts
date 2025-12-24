import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * DTOWriter
 * 
 * Writes DTOs with proper validation decorators based on configuration.
 * Supports class-validator and class-transformer decorators.
 * Can be customized based on whitelabeling, RBAC, and multitenancy settings.
 */

export interface DTOWriterConfig {
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  database: 'supabase' | 'gcloud-sql';
}

export interface DTOProperty {
  name: string;
  type: string;
  isOptional?: boolean;
  validators?: string[];
  transformers?: string[];
  description?: string;
}

export interface DTODefinition {
  className: string;
  description?: string;
  properties: DTOProperty[];
  implements?: string[];
}

/**
 * Write a DTO file with validation decorators
 */
export async function writeDTOFile(
  filePath: string,
  dto: DTODefinition,
  config: DTOWriterConfig
): Promise<void> {
  const content = generateDTOClass(dto, config);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Generate the complete DTO class content
 */
export function generateDTOClass(
  dto: DTODefinition,
  config: DTOWriterConfig
): string {
  const imports = generateDTOImports(dto, config);
  const classBody = generateDTOClassBody(dto, config);
  const classDeclaration = generateDTOClassDeclaration(dto);

  return `${imports}\n${classDeclaration} {\n${classBody}\n}\n`;
}

/**
 * Generate import statements based on DTO properties
 */
function generateDTOImports(dto: DTODefinition, config: DTOWriterConfig): string {
  const imports: Set<string> = new Set();

  // Check if we need class-validator decorators
  const needsValidation = dto.properties.some((p) => p.validators && p.validators.length > 0);
  if (needsValidation) {
    imports.add(
      "import { IsEmail, IsString, IsStrongPassword, MinLength, MaxLength, Matches, IsOptional, IsUUID, IsDefined, ValidationError } from 'class-validator';"
    );
  }

  // Check if we need class-transformer decorators
  const needsTransformation = dto.properties.some((p) => p.transformers && p.transformers.length > 0);
  if (needsTransformation) {
    imports.add("import { Transform, Type, Expose } from 'class-transformer';");
  }

  // Check if we need Prisma types
  const needsPrismaTypes = dto.properties.some((p) => p.type === 'UUID' || p.type === 'Date');
  if (needsPrismaTypes && config.database) {
    imports.add("// Database types imported from Prisma");
  }

  return Array.from(imports).join('\n');
}

/**
 * Generate the class declaration line
 */
function generateDTOClassDeclaration(dto: DTODefinition): string {
  let declaration = `export class ${dto.className}`;
  if (dto.implements && dto.implements.length > 0) {
    declaration += ` implements ${dto.implements.join(', ')}`;
  }
  return declaration;
}

/**
 * Generate the class body with properties and decorators
 */
function generateDTOClassBody(dto: DTODefinition, config: DTOWriterConfig): string {
  const lines: string[] = [];

  if (dto.description) {
    lines.push(`  /**\n   * ${dto.description}\n   */`);
  }

  for (const prop of dto.properties) {
    // Add decorators
    if (prop.validators && prop.validators.length > 0) {
      for (const validator of prop.validators) {
        lines.push(`  @${validator}`);
      }
    }

    if (prop.transformers && prop.transformers.length > 0) {
      for (const transformer of prop.transformers) {
        lines.push(`  @${transformer}`);
      }
    }

    // Add property with optional marker
    const isOptional = prop.isOptional ? '?' : '';
    const type = getTypeDefinition(prop.type);
    lines.push(`  ${prop.name}${isOptional}: ${type};`);

    // Add blank line between properties
    if (prop !== dto.properties[dto.properties.length - 1]) {
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Get the TypeScript type definition for a property
 */
function getTypeDefinition(type: string): string {
  const typeMap: { [key: string]: string } = {
    string: 'string',
    email: 'string',
    password: 'string',
    UUID: 'string',
    number: 'number',
    boolean: 'boolean',
    Date: 'Date',
    object: 'Record<string, any>',
    array: 'any[]',
  };

  return typeMap[type] || type;
}

/**
 * Pre-built DTO definitions
 */

/**
 * LoginDTO - Standard login with email and password
 */
export function createLoginDTO(config: DTOWriterConfig): DTODefinition {
  return {
    className: 'LoginDto',
    description: 'Login credentials for user authentication',
    properties: [
      {
        name: 'email',
        type: 'email',
        validators: ['IsEmail()', 'IsDefined()'],
        description: 'User email address',
      },
      {
        name: 'password',
        type: 'password',
        validators: ['IsString()', 'MinLength(8)', 'IsDefined()'],
        description: 'User password (minimum 8 characters)',
      },
      ...(config.multitenant
        ? [
            {
              name: 'tenantId',
              type: 'UUID',
              isOptional: true,
              validators: ['IsUUID()', 'IsOptional()'],
              description: 'Optional tenant identifier for multitenant login',
            },
          ]
        : []),
    ],
  };
}

/**
 * RegisterDTO - User registration with optional whitelabel support
 */
export function createRegisterDTO(config: DTOWriterConfig): DTODefinition {
  const properties: DTOProperty[] = [
    {
      name: 'email',
      type: 'email',
      validators: ['IsEmail()', 'IsDefined()'],
      description: 'User email address (unique)',
    },
    {
      name: 'password',
      type: 'password',
      validators: ['IsString()', 'IsStrongPassword()', 'MinLength(8)', 'IsDefined()'],
      description: 'User password (minimum 8 characters, must be strong)',
    },
    {
      name: 'firstName',
      type: 'string',
      validators: ['IsString()', 'MinLength(2)', 'MaxLength(50)'],
      description: 'User first name',
    },
    {
      name: 'lastName',
      type: 'string',
      validators: ['IsString()', 'MinLength(2)', 'MaxLength(50)'],
      description: 'User last name',
    },
  ];

  // Add whitelabel support
  if (config.whitelabel) {
    properties.push({
      name: 'brandId',
      type: 'UUID',
      isOptional: true,
      validators: ['IsUUID()', 'IsOptional()'],
      description: 'Brand/Whitelabel identifier',
    });
    properties.push({
      name: 'theme',
      type: 'string',
      isOptional: true,
      validators: ['IsString()', 'IsOptional()'],
      description: 'Custom theme preference',
    });
  }

  // Add multitenant support
  if (config.multitenant) {
    properties.push({
      name: 'tenantId',
      type: 'UUID',
      isOptional: true,
      validators: ['IsUUID()', 'IsOptional()'],
      description: 'Tenant identifier (if registering for specific tenant)',
    });
  }

  return {
    className: 'RegisterDto',
    description: 'User registration data with validation',
    properties,
  };
}

/**
 * RefreshTokenDTO - Token refresh request
 */
export function createRefreshTokenDTO(config: DTOWriterConfig): DTODefinition {
  return {
    className: 'RefreshTokenDto',
    description: 'Request for token refresh',
    properties: [
      {
        name: 'refreshToken',
        type: 'string',
        validators: ['IsString()', 'IsDefined()'],
        description: 'Valid refresh token',
      },
    ],
  };
}

/**
 * CreateRoleDTO - RBAC role creation
 */
export function createRoleDTO(config: DTOWriterConfig): DTODefinition {
  return {
    className: 'CreateRoleDto',
    description: 'Create a new role for RBAC',
    properties: [
      {
        name: 'name',
        type: 'string',
        validators: ['IsString()', 'MinLength(3)', 'MaxLength(50)', 'IsDefined()'],
        description: 'Role name (unique)',
      },
      {
        name: 'description',
        type: 'string',
        isOptional: true,
        validators: ['IsString()', 'MaxLength(200)', 'IsOptional()'],
        description: 'Role description',
      },
      {
        name: 'permissions',
        type: 'array',
        isOptional: true,
        validators: ['IsOptional()'],
        description: 'Array of permission identifiers to assign',
      },
      ...(config.multitenant
        ? [
            {
              name: 'tenantId',
              type: 'UUID',
              isOptional: true,
              validators: ['IsUUID()', 'IsOptional()'],
              description: 'Tenant-scoped role (if multitenant)',
            },
          ]
        : []),
    ],
  };
}

/**
 * AssignRoleDTO - Assign role to user
 */
export function createAssignRoleDTO(config: DTOWriterConfig): DTODefinition {
  return {
    className: 'AssignRoleDto',
    description: 'Assign a role to a user',
    properties: [
      {
        name: 'userId',
        type: 'UUID',
        validators: ['IsUUID()', 'IsDefined()'],
        description: 'User identifier',
      },
      {
        name: 'roleId',
        type: 'UUID',
        validators: ['IsUUID()', 'IsDefined()'],
        description: 'Role identifier',
      },
    ],
  };
}

/**
 * CreateTenantDTO - Multitenant support
 */
export function createTenantDTO(config: DTOWriterConfig): DTODefinition {
  const properties: DTOProperty[] = [
    {
      name: 'name',
      type: 'string',
      validators: ['IsString()', 'MinLength(2)', 'MaxLength(100)', 'IsDefined()'],
      description: 'Tenant name',
    },
    {
      name: 'slug',
      type: 'string',
      validators: ['IsString()', 'MinLength(2)', 'MaxLength(50)', 'Matches(/^[a-z0-9-]+$/)', 'IsDefined()'],
      description: 'URL-friendly slug (lowercase, alphanumeric, hyphens only)',
    },
    {
      name: 'domain',
      type: 'string',
      isOptional: true,
      validators: ['IsString()', 'MaxLength(255)', 'IsOptional()'],
      description: 'Custom domain for whitelabel support',
    },
  ];

  if (config.whitelabel) {
    properties.push({
      name: 'isWhitelabel',
      type: 'boolean',
      isOptional: true,
      transformers: ['Transform(({ value }) => value === true)'],
      description: 'Enable whitelabel branding for this tenant',
    });
  }

  return {
    className: 'CreateTenantDto',
    description: 'Create a new tenant',
    properties,
  };
}

/**
 * Write all standard DTOs for auth module
 */
export async function writeAuthDTOs(
  projectRoot: string,
  authDtoPath: string,
  config: DTOWriterConfig
): Promise<void> {
  const dtosDir = path.join(projectRoot, 'src', authDtoPath);
  await fs.ensureDir(dtosDir);

  const dtos = [
    { name: 'login.dto.ts', dto: createLoginDTO(config) },
    { name: 'register.dto.ts', dto: createRegisterDTO(config) },
    { name: 'refresh-token.dto.ts', dto: createRefreshTokenDTO(config) },
  ];

  for (const { name, dto } of dtos) {
    await writeDTOFile(path.join(dtosDir, name), dto, config);
  }
}

/**
 * Write all DTOs for RBAC module (if enabled)
 */
export async function writeRBACDTOs(
  projectRoot: string,
  rbacDtoPath: string,
  config: DTOWriterConfig
): Promise<void> {
  if (!config.rbac) {
    return;
  }

  const dtosDir = path.join(projectRoot, 'src', rbacDtoPath);
  await fs.ensureDir(dtosDir);

  const dtos = [
    { name: 'create-role.dto.ts', dto: createRoleDTO(config) },
    { name: 'assign-role.dto.ts', dto: createAssignRoleDTO(config) },
  ];

  for (const { name, dto } of dtos) {
    await writeDTOFile(path.join(dtosDir, name), dto, config);
  }
}

/**
 * Write all DTOs for tenant module (if enabled)
 */
export async function writeTenantDTOs(
  projectRoot: string,
  tenantDtoPath: string,
  config: DTOWriterConfig
): Promise<void> {
  if (!config.multitenant) {
    return;
  }

  const dtosDir = path.join(projectRoot, 'src', tenantDtoPath);
  await fs.ensureDir(dtosDir);

  const dtos = [{ name: 'create-tenant.dto.ts', dto: createTenantDTO(config) }];

  for (const { name, dto } of dtos) {
    await writeDTOFile(path.join(dtosDir, name), dto, config);
  }
}

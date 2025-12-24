# auth-bp-nest

NestJS Authentication Boilerplate with support for whitelabeling, RBAC, and multitenant architectures.

<div align="center">

[![npm version](https://img.shields.io/npm/v/auth-bp-nest?style=flat-square&color=blue)](https://www.npmjs.com/package/auth-bp-nest)
[![npm downloads](https://img.shields.io/npm/dm/auth-bp-nest?style=flat-square&color=brightgreen)](https://www.npmjs.com/package/auth-bp-nest)
[![license](https://img.shields.io/npm/l/auth-bp-nest?style=flat-square)](https://github.com/rambaarde/auth-bp-nest/blob/main/LICENSE)

[📦 View on npm](https://www.npmjs.com/package/auth-bp-nest)

</div>

## Features

✅ **JWT Authentication** - Secure token-based authentication  
✅ **Validated DTOs** - Full class-validator decorators on all request objects  
✅ **Optional RBAC** - Role-Based Access Control with permissions  
✅ **Optional Multitenant** - Multi-tenant support with data isolation  
✅ **Whitelabeling** - Support for custom branding and domains  
✅ **PostgreSQL** - Supabase or Google Cloud SQL  
✅ **Prisma ORM** - Type-safe database access  
✅ **AI-Native** - `.context.md` files in every folder for LLM assistance  

## Installation

```bash
# 1. Create a new NestJS project
nest new my-app
cd my-app

# 2. Install auth-bp-nest
npm install auth-bp-nest

# 3. Initialize authentication scaffolding
npx auth-bp-nest init
```

The CLI will prompt you for configuration, then scaffold a complete authentication system into your project.

## Quick Start

Run the initialization command in your existing NestJS project:

```bash
npx auth-bp-nest init
```

You'll be prompted with configuration options:

```
? Which database are you using?
  > Supabase PostgreSQL
    Google Cloud SQL PostgreSQL

? Enable Whitelabeling? (Yes / No)
? Enable RBAC (Role-Based Access Control)? (Yes / No)
? Enable Multitenant support? (Yes / No)
```

Based on your selections, the CLI generates:
- **Auth Module** - JWT authentication with guards and strategies
- **DTOs** - Fully validated data transfer objects with class-validator decorators
- **Database Models** - Prisma schema with entities and migrations
- **RBAC Module** (optional) - Role-based access control system
- **Tenant Module** (optional) - Multitenant support with data isolation
- **.context.md Files** - AI-friendly documentation for Copilot/Cursor

## How It Works

### Three Core Generators

The CLI uses three specialized TypeScript generators that work together:

#### 1. **Generator Orchestrator** - NestJS Structure
Spawns `nest g` commands to scaffold modules, controllers, services, and DTOs in your project.

```bash
nest g module auth
nest g controller auth
nest g service auth
nest g class auth/dto/login.dto --no-spec
```

#### 2. **DTO Writer** - Validation & Decorators
Fills generated DTOs with `class-validator` decorators and configuration-aware properties.

```typescript
// Generated with full validation:
export class LoginDto {
  @IsEmail()
  @IsDefined()
  email: string;

  @IsString()
  @MinLength(8)
  @IsDefined()
  password: string;

  // Added if multitenant enabled:
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
```

#### 3. **Context Generator** - AI Documentation
Creates `.context.md` files in each module with explicit validation rules, architecture patterns, and integration points for AI assistants.

```markdown
# Auth Module Context

## DTOs

### LoginDto
- email: RFC 5322 email format [IsEmail, IsDefined]
- password: min 8 chars [IsString, MinLength(8), IsDefined]
- tenantId: optional UUID [IsUUID, IsOptional]

## Validation Rules
- Email must be unique in database
- Password must include: uppercase, lowercase, numbers, symbols
...
```

## Database Setup

### Supabase

```bash
SUPABASE_URL=https://your-project.supabase.co
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
```

### Google Cloud SQL

```bash
DATABASE_URL=postgresql://user:password@cloudsql-instance:5432/database
```

## Running Migrations

```bash
npx prisma migrate dev --name <migration_name>
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run tests
```

## Integration with Frontend

This package works seamlessly with `auth-bp-next` frontend package. Ensure both are initialized with matching configuration options.

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user

### RBAC (if enabled)
- `GET /rbac/roles` - Get all roles
- `POST /rbac/roles` - Create new role
- `GET /rbac/permissions` - Get all permissions

### Tenant (if enabled)
- `GET /tenant` - Get current tenant
- `POST /tenant` - Create new tenant

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT

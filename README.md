# auth-bp-nest

NestJS Authentication Boilerplate with support for whitelabeling, RBAC, and multitenant architectures.

## Features

✅ **JWT Authentication** - Secure token-based authentication  
✅ **Optional RBAC** - Role-Based Access Control with permissions  
✅ **Optional Multitenant** - Multi-tenant support with data isolation  
✅ **Whitelabeling** - Support for custom branding and domains  
✅ **PostgreSQL** - Supabase or Google Cloud SQL  
✅ **Prisma ORM** - Type-safe database access  
✅ **AI-Native** - `.context.md` files in every folder for LLM assistance  

## Installation

```bash
npm install auth-bp-nest
npx auth-bp-nest init
```

## Quick Start

After running `init`, you'll be prompted with configuration options:

```
? Which database are you using? (Supabase / Google Cloud SQL)
? Enable Whitelabeling? (Yes / No)
? Enable RBAC? (Yes / No)
? Enable Multitenant support? (Yes / No)
```

This generates a complete NestJS authentication module with:
- JWT authentication service
- Auth guards and strategies
- Database models and migrations
- Configuration files (if selected)
- `.context.md` files for guidance

## Project Structure

```
src/
├── auth/                 # Authentication logic
│   ├── jwt.service.ts   # JWT creation & validation
│   ├── auth.guard.ts    # NestJS guards
│   ├── auth.controller.ts
│   ├── strategies/      # Passport strategies
│   └── dtos/           # Data transfer objects
├── database/           # Database setup
│   ├── schema.prisma   # Prisma schema
│   ├── entities/       # Entity definitions
│   └── migrations/     # Migration files
├── rbac/              # (Optional) Role-based access control
│   ├── rbac.service.ts
│   ├── rbac.guard.ts
│   └── entities/
├── tenant/            # (Optional) Multitenant support
│   ├── tenant.service.ts
│   ├── tenant.middleware.ts
│   └── entities/
└── .context.md        # Root context for AI assistance
```

## Configuration

Each folder has a `.context.md` file explaining:
- Purpose and responsibilities
- How to extend and customize
- Related modules and dependencies
- Common tasks and examples

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

# ReMarket - Web Application

A modern e-commerce marketplace web application built with Next.js, React, and TypeScript.

[![NextJS](https://img.shields.io/badge/NextJS-15.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-blue?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-blue?style=for-the-badge)](https://orm.drizzle.team/)

## 📋 Overview

ReMarket is a modern e-commerce marketplace platform that allows users to buy and sell products. This repository contains the frontend application built with Next.js, React, and TypeScript.

## ✨ Features

- **Modern Tech Stack**: Next.js App Router, React 19, TypeScript, and Tailwind CSS
- **Responsive Design**: Fully responsive UI for all device sizes
- **Optimized Performance**: React Server Components and optimized image loading
- **Accessible Components**: Built with Shadcn UI and Radix UI primitives
- **Type-Safe Development**: Full TypeScript support throughout the codebase
- **Containerization**: Docker support for both development and production environments

## 🛠️ Technologies

- **Frontend Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.0
- **Component Library**: Shadcn UI with Radix UI primitives
- **Language**: TypeScript 5
- **Database**: PostgreSQL with Drizzle ORM
- **Package Manager**: pnpm
- **Development Tools**: ESLint, Prettier, Husky, lint-staged, Turbopack
- **Containerization**: Docker and Docker Compose

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or later
- pnpm package manager
- Docker and Docker Compose (optional, for containerized setup)

### Installation

#### Option 1: Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/ReMarket-SE2/webapp.git
   cd remarket-frontend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Start the PostgreSQL database:

   ```bash
   # Run only the PostgreSQL container for local development
   docker-compose -f docker/docker-compose.yml up -d postgres
   ```

5. Generate database migrations (if schema has changed or for initial setup):

   ```bash
   pnpm db:generate
   ```

6. Apply database migrations:

   ```bash
   pnpm db:migrate
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

#### Option 2: Docker Development

1. Clone the repository:

   ```bash
   git clone https://github.com/ReMarket-SE2/webapp.git
   cd remarket-frontend
   ```

2. Start the development container:

   ```bash
   docker-compose -f docker/docker-compose.dev.yml up --build
   ```

   This will start both the PostgreSQL database and the Next.js application. Database migrations will run automatically.

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

#### Option 3: Docker Production

1. Clone the repository:

   ```bash
   git clone https://github.com/ReMarket-SE2/webapp.git
   cd remarket-frontend
   ```

2. Start the production container:

   ```bash
   docker-compose -f docker/docker-compose.yml up --build
   ```

   This will start both the PostgreSQL database and the Next.js application. Database migrations will run automatically.

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🔧 Environment Setup

1. Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

2. Fill missing secrets in `.env`:

3. Never commit the `.env` file to version control

## 📁 Project Structure

```
webapp/
├── app/                # Next.js App Router pages
│   └── api/           # API endpoints
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   └── ui/            # UI components
├── lib/               # Utility functions and shared code
│   ├── db/             # Database configuration and models
│   │   ├── migrations/ # Generated database migrations
│   │   ├── schema/     # Database schema definitions
│   ├── hooks/         # Custom React hooks
│   └── users/         # User actions
├── middleware/        # Next.js middleware
└── public/            # Static assets
├── docker/             # Docker configuration files
│   ├── Dockerfile      # Production Docker configuration
│   ├── Dockerfile.dev  # Development Docker configuration
│   ├── docker-compose.yml       # Production Docker Compose config
│   └── docker-compose.dev.yml   # Development Docker Compose config
├── public/             # Static assets
└── ...
```

## 💾 Database

The application uses PostgreSQL with Drizzle ORM for database operations. The database setup includes:

- **Schema Definition**: Type-safe schema definitions using Drizzle ORM
- **Migrations**: Automatic migration generation and application
- **Docker Integration**: PostgreSQL is included in both development and production Docker setups

### Database Models

The application includes the following database models:

- **Users**: User accounts with authentication information
- **Categories**: Product categories
- **Listings**: Product listings with details and pricing
- **Photos**: Image storage for listings and user profiles
- **Wishlists**: User-created collections of desired listings
- **Reviews**: User reviews for listings with ratings
- **Orders**: Purchase orders with shipping and payment information

For detailed information about the database schema, relationships, and usage examples, see [lib/db/README.md](lib/db/README.md).

### Database Commands

- Generate migrations:

  ```bash
  pnpm db:generate
  ```

  This uses the latest `drizzle-kit generate` command to create migration files based on your schema.

- Apply migrations:

  ```bash
  pnpm db:migrate
  ```

- View database with Drizzle Studio:
  ```bash
  pnpm db:studio
  ```

## 💻 Development

### Commands

- `pnpm dev`: Start the development server with Turbopack
- `pnpm build`: Build the application for production
- `pnpm start`: Start the production server
- `pnpm lint`: Run ESLint to check code quality
- `pnpm db:generate`: Generate database migrations
- `pnpm db:migrate`: Apply database migrations
- `pnpm db:studio`: View database with Drizzle Studio

### Git Hooks

This project uses Husky and lint-staged for precommit hooks:

- **Pre-commit**: Automatically runs ESLint and Prettier on staged files
- **Commit Message**: Enforces [Conventional Commits](https://www.conventionalcommits.org/) format

For more details on commit message format, see [CONTRIBUTING.md](CONTRIBUTING.md).

### Docker Commands

- Development (with database):

  ```bash
  docker-compose -f docker/docker-compose.dev.yml up --build
  ```

- Production (with database):

  ```bash
  docker-compose -f docker/docker-compose.yml up --build
  ```

- Stop containers:
  ```bash
  docker-compose -f docker/docker-compose.yml down
  ```

### Coding Standards

This project follows specific coding standards:

- TypeScript for type-safe development
- Functional and declarative programming patterns
- Server components first approach
- Shadcn UI components for consistent UI
- Tailwind CSS for styling

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details on how to get started.

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for Continuous Integration and Deployment:

### Pull Request Validation

All pull requests to the `main` or `master` branches trigger an automated validation workflow that:

1. Sets up the environment with Node.js and pnpm
2. Installs dependencies with optimized caching
3. Runs linting (`pnpm lint`)
4. Builds the application (`pnpm build`)
5. Blocks merging if any of these steps fail

This ensures that only high-quality code that passes all checks can be merged into the main branches.

To see the workflow configuration, check the `.github/workflows/pull-request.yml` file.

## 🧪 Testing

_Testing documentation to be added_

## 📄 License

This project is licensed under the MIT License

## 📚 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

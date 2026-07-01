# SA University Management Portal - Server

## Overview

This is the backend API server for the SA University Management Portal, built with Node.js, Express, and TypeScript.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js + OAuth2 + JWT
- **Security**: Helmet + CORS + rate-limit
- **Logging**: Winston + Morgan

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other configuration.

### Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Middleware
│   ├── prisma/           # Database
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utilities
│   ├── types/            # TypeScript types
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── .env.example
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run type-check` - Run TypeScript type checking

## Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Students
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Faculty
- `GET /api/faculty` - List all faculty
- `GET /api/faculty/:id` - Get faculty details
- `POST /api/faculty` - Create new faculty
- `PUT /api/faculty/:id` - Update faculty
- `DELETE /api/faculty/:id` - Delete faculty

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `GET /api/enrollments` - List all enrollments
- `POST /api/enrollments` - Enroll in section
- `PUT /api/enrollments/:id` - Update enrollment
- `DELETE /api/enrollments/:id` - Drop enrollment

### Grades
- `GET /api/grades` - List all grades
- `POST /api/grades` - Submit grade
- `PUT /api/grades/:id` - Update grade

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Process payment
- `PUT /api/payments/:id` - Update payment status

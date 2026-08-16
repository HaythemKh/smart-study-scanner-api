# Smart Study Scanner API

> Backend API for Smart Study Scanner - An intelligent document processing and study assistant platform powered by AI

## 📖 Overview

Smart Study Scanner API is a NestJS-based backend service that transforms documents (PDF, DOCX, PPTX) into intelligent study materials. Using AI technology, it generates summaries, quizzes, and flashcards to help students learn more effectively.

## ✨ Key Features

- 📄 **Document Processing** - Upload and process PDF, DOCX, PPTX files
- 🤖 **AI Content Generation** - Auto-generate summaries, quizzes, and flashcards using Gemini AI
- 🔐 **Authentication** - Google OAuth for students, email/password for admins
- 🎮 **Gamification** - XP, levels, and streaks to motivate learning
- 📚 **Personal Library** - Each student gets their own content collection
- 👥 **Multi-Role System** - Separate interfaces for students and administrators

## 🛠️ Tech Stack

- **NestJS** - Backend framework
- **TypeScript** - Programming language
- **PostgreSQL** - Database (via Supabase)
- **Prisma** - ORM for database access
- **Fastify** - High-performance HTTP server
- **Gemini AI** - Content generation
- **Google OAuth** - Student authentication
- **JWT** - Token-based authorization

## 📋 Prerequisites

Make sure you have installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-study-scanner-api.git
cd smart-study-scanner-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Server Port
PORT=3000

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Google OAuth Credentials
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini AI API Key
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key"
```

**Important Notes:**

- Replace database credentials with your Supabase database connection strings
- Generate a strong `JWT_SECRET` for production
- Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Get Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 4. Database Setup

Generate Prisma Client and run migrations:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 5. Start the Server

#### Development Mode (with auto-reload)

```bash
npm run start:dev
```

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

### 6. Create Admin User (Optional)

To create an admin user for accessing the admin dashboard:

```bash
# Using environment variables
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="your-secure-password" ADMIN_NAME="Admin User" npx ts-node src/admin/scripts/create-admin.ts

# Or with default values (admin@smartstudyscanner.com / admin123)
npx ts-node src/admin/scripts/create-admin.ts
```

**Note**: The script will create an admin user with the specified credentials. Change the default password immediately after first login.

## 📚 Available Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run start:dev`       | Start development server with hot-reload |
| `npm run start:prod`      | Start production server                  |
| `npm run build`           | Build the application for production     |
| `npm run prisma:generate` | Generate Prisma Client                   |
| `npm run prisma:migrate`  | Run database migrations                  |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI)        |
| `npm run test`            | Run unit tests                           |
| `npm run lint`            | Lint code with ESLint                    |
| `npm run format`          | Format code with Prettier                |

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users** - Base user entity (students & admins)
- **Students** - Extended user with gamification stats (XP, level, streak)
- **Admins** - Extended user with admin privileges
- **Documents** - Uploaded file metadata
- **Libraries** - Student's personal content collection
- **Summaries** - AI-generated document summaries
- **Quizzes** - AI-generated quizzes with questions
- **FlashcardSets** - AI-generated flashcard collections
- **QuizAttempts** - Student quiz results tracking

## 🔌 API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Main Endpoints

| Category          | Endpoint                         | Description         |
| ----------------- | -------------------------------- | ------------------- |
| **Auth**          | `POST /auth/google`              | Google OAuth login  |
| **Auth**          | `POST /auth/admin/login`         | Admin login         |
| **Documents**     | `POST /documents/upload`         | Upload document     |
| **AI Generation** | `POST /ai-generation/summary`    | Generate summary    |
| **AI Generation** | `POST /ai-generation/quiz`       | Generate quiz       |
| **AI Generation** | `POST /ai-generation/flashcards` | Generate flashcards |
| **Library**       | `GET /library`                   | Get user's library  |
| **Quizzes**       | `POST /quiz-attempts`            | Submit quiz attempt |
| **Gamification**  | `POST /gamification/add-xp`      | Add XP to student   |

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/            # Authentication & authorization
│   ├── users/           # User management
│   ├── admin/           # Admin operations
│   ├── document/        # Document upload & processing
│   ├── ai-generation/   # AI content generation (Gemini)
│   ├── summary/         # Summary management
│   ├── quiz/            # Quiz management
│   ├── flashcard/       # Flashcard management
│   ├── library/         # User library
│   ├── gamification/    # XP, levels, streaks
│   ├── quiz-attempts/   # Quiz attempt tracking
│   ├── prisma/          # Database service
│   └── util/            # Utilities & helpers
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── .env                 # Environment variables (not in repo)
├── package.json         # Dependencies
└── README.md            # This file
```

## 🔗 Related Repositories

- **Mobile App**: [smart-study-scanner-mobile](https://github.com/HaythemKh/smart-study-scanner-mobile) - React Native app for students
- **Admin Dashboard**: [smart-study-scanner-admin](https://github.com/HaythemKh/smart-study-scanner-admin) - Next.js admin panel

---

**Built with ❤️ using NestJS**

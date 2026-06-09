# QuizArena

A production-grade, role-based online assessment platform for creating, scheduling, assigning, conducting, and evaluating timed MCQ quizzes.

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React 19, TypeScript, SCSS Modules, Vite        |
| Backend    | Node.js, Express.js, TypeScript                 |
| Database   | MongoDB Atlas, Mongoose ODM                     |
| Auth       | JWT (Access + Refresh), bcrypt                   |
| State      | Zustand, TanStack Query                         |
| Charts     | Recharts                                        |

## Roles

- **Admin** — Full platform management, analytics, user management
- **Instructor** — Quiz creation, participant management, results
- **Participant** — Quiz attempts, results, history

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Configure your environment variables
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

## Project Structure

```
quiz/
├── backend/          # Express + TypeScript API
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── jobs/
│       ├── validators/
│       ├── utils/
│       ├── types/
│       └── constants/
│
├── client/           # Vite + React 19 + TypeScript
│   └── src/
│       ├── atoms/
│       ├── molecules/
│       ├── organisms/
│       ├── templates/
│       ├── pages/
│       ├── layouts/
│       ├── routes/
│       ├── services/
│       ├── hooks/
│       ├── store/
│       ├── context/
│       ├── utils/
│       ├── constants/
│       ├── types/
│       ├── assets/
│       └── styles/
```

## License

Private — All rights reserved.

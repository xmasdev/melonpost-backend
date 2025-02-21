# Video Sharing Platform API

A RESTful API built with Node.js, Express, and MongoDB for a video sharing platform.

## Features

- 👤 User Authentication (JWT)
- 📹 Video Upload & Management
- 👍 Video Likes System
- 🔒 Protected Routes
- 📝 MongoDB Integration

## Tech Stack

- Node.js & Express
- TypeScript
- MongoDB & Mongoose
- JWT Authentication
- Multer for File Upload

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm/yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create uploads directory:
```bash
mkdir -p uploads/videos
```

### Environment Setup

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=video-sharing
JWT_SECRET=your-secret-key
```

### Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Auth Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |

### Video Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/videos/upload` | Upload video | Yes |
| GET | `/api/videos` | Get all videos | No |
| GET | `/api/videos/:videoId` | Stream video | No |
| POST | `/api/videos/:videoId/like` | Like a video | Yes |

## Request Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Upload Video
```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@/path/to/video.mp4" \
  -F "title=My Video" \
  -F "description=Video description"
```

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Security Features

- Password Hashing
- JWT Authentication
- Protected Routes
- File Type Validation
- File Size Limits (100MB)

## Project Structure
```
src/
├── app.ts              # App entry point
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Database models
└── routes/            # API routes
```

## License

MIT License

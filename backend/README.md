# 🚀 Social Media API

A state-of-the-art social media backend API built with **Express.js** and **Supabase**. Packed with all the features you need for a modern social media platform.

## ✨ Features

### Core Features
- 🔐 **Authentication** - JWT-based auth with email/password, social login
- 👤 **User Management** - Profiles, follow/unfollow, blocking
- 📝 **Posts** - Create, edit, delete posts with media support
- 💬 **Comments** - Nested comments with likes
- ❤️ **Interactions** - Like, bookmark, share posts
- 🔔 **Notifications** - Real-time notification system
- 💌 **Direct Messages** - Private messaging between users
- 📸 **Stories** - 24-hour disappearing stories
- 🔍 **Search** - Search users, posts, hashtags
- 📊 **Analytics** - Post engagement stats

### Advanced Features
- 🛡️ **Security** - Helmet, CORS, Rate limiting
- 📄 **Pagination** - Efficient cursor-based pagination
- 🗄️ **RLS** - Row Level Security with Supabase
- 🧹 **Soft Delete** - Safe data deletion
- 🏷️ **Hashtags & Mentions** - Auto-extraction and linking
- 🔒 **Privacy Controls** - Public/private/followers-only posts
- 📈 **Trending** - Algorithmic content discovery

## 📁 Project Structure

```
social-media-backend/
├── app.js                 # Main application entry
├── package.json
├── .env.example
├── README.md
├── controllers/           # Route handlers
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   ├── commentController.js
│   ├── messageController.js
│   ├── storyController.js
│   └── uploadController.js
├── models/               # Database models
│   ├── index.js
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Message.js
│   └── Story.js
├── routes/               # API routes
│   ├── index.js
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   ├── messages.js
│   ├── stories.js
│   └── upload.js
├── middleware/           # Express middleware
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── services/             # Business logic
│   ├── feedService.js
│   └── notificationService.js
├── utils/                # Helper functions
│   └── helpers.js
└── database/             # Database files
    └── schema.sql
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- PostgreSQL (if running locally)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd social-media-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Set up the database**
```bash
# Run the schema in Supabase SQL Editor
# Or use:
npm run db:migrate
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/refresh-token` | Refresh JWT token | ❌ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| PUT | `/api/auth/password` | Update password | ✅ |

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/:username` | Get user profile | Optional |
| GET | `/api/users/id/:userId` | Get user by ID | Optional |
| PUT | `/api/users/me/profile` | Update profile | ✅ |
| PUT | `/api/users/me/avatar` | Update avatar | ✅ |
| POST | `/api/users/:userId/follow` | Follow user | ✅ |
| DELETE | `/api/users/:userId/follow` | Unfollow user | ✅ |
| GET | `/api/users/:userId/followers` | Get followers | Optional |
| GET | `/api/users/:userId/following` | Get following | Optional |
| GET | `/api/users/search?q=query` | Search users | ✅ |
| GET | `/api/users/suggestions` | Get suggested users | ✅ |
| GET | `/api/users/notifications` | Get notifications | ✅ |
| PUT | `/api/users/notifications/read-all` | Mark all read | ✅ |
| GET | `/api/users/notifications/unread-count` | Get unread count | ✅ |

### Post Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts/feed` | Get personalized feed | ✅ |
| GET | `/api/posts/explore` | Get explore posts | Optional |
| GET | `/api/posts/search?q=query` | Search posts | ❌ |
| GET | `/api/posts/hashtag/:tag` | Get posts by hashtag | ❌ |
| GET | `/api/posts/trending-hashtags` | Get trending hashtags | ❌ |
| GET | `/api/posts/user/:userId` | Get user's posts | Optional |
| GET | `/api/posts/bookmarks` | Get bookmarked posts | ✅ |
| POST | `/api/posts` | Create post | ✅ |
| GET | `/api/posts/:postId` | Get post by ID | Optional |
| PUT | `/api/posts/:postId` | Update post | ✅ |
| DELETE | `/api/posts/:postId` | Delete post | ✅ |
| POST | `/api/posts/:postId/like` | Like post | ✅ |
| DELETE | `/api/posts/:postId/like` | Unlike post | ✅ |
| GET | `/api/posts/:postId/likes` | Get post likes | ❌ |
| POST | `/api/posts/:postId/bookmark` | Bookmark post | ✅ |
| DELETE | `/api/posts/:postId/bookmark` | Remove bookmark | ✅ |
| POST | `/api/posts/:postId/share` | Share post | ✅ |

### Comment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts/:postId/comments` | Get post comments | ❌ |
| POST | `/api/posts/:postId/comments` | Create comment | ✅ |
| GET | `/api/posts/:postId/comments/:commentId/replies` | Get replies | ❌ |
| GET | `/api/comments/:commentId` | Get comment by ID | ❌ |
| PUT | `/api/comments/:commentId` | Update comment | ✅ |
| DELETE | `/api/comments/:commentId` | Delete comment | ✅ |
| POST | `/api/comments/:commentId/like` | Like comment | ✅ |
| DELETE | `/api/comments/:commentId/like` | Unlike comment | ✅ |

### Message Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/conversations` | Get conversations | ✅ |
| GET | `/api/messages/unread-count` | Get unread count | ✅ |
| GET | `/api/messages/search?q=query` | Search messages | ✅ |
| GET | `/api/messages/:userId` | Get conversation | ✅ |
| POST | `/api/messages/:recipientId` | Send message | ✅ |
| PUT | `/api/messages/:userId/read` | Mark as read | ✅ |
| PUT | `/api/messages/:messageId` | Edit message | ✅ |
| DELETE | `/api/messages/:messageId` | Delete message | ✅ |

### Story Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stories/feed` | Get stories feed | ✅ |
| GET | `/api/stories/me` | Get my stories | ✅ |
| POST | `/api/stories` | Create story | ✅ |
| GET | `/api/stories/user/:userId` | Get user's stories | Optional |
| GET | `/api/stories/:storyId` | Get story by ID | Optional |
| POST | `/api/stories/:storyId/view` | Mark as viewed | ✅ |
| GET | `/api/stories/:storyId/viewers` | Get viewers | ✅ |
| GET | `/api/stories/:storyId/stats` | Get story stats | ✅ |
| DELETE | `/api/stories/:storyId` | Delete story | ✅ |

### Upload Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/avatar` | Upload avatar | ✅ |
| POST | `/api/upload/post-media` | Upload post media | ✅ |
| POST | `/api/upload/story-media` | Upload story media | ✅ |
| DELETE | `/api/upload/file` | Delete file | ✅ |

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by calling `/api/auth/login` or `/api/auth/signup`.

## 📦 Request/Response Examples

### Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world! #firstpost @username",
    "media_urls": ["https://example.com/image.jpg"],
    "visibility": "public",
    "location": "New York, NY"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "uuid",
    "content": "Hello world! #firstpost @username",
    "author": { ... },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Feed
```bash
curl http://localhost:3000/api/posts/feed \
  -H "Authorization: Bearer <token>"
```

## 🗄️ Database Schema

The database schema is defined in `database/schema.sql`. Key tables:

- `users` - User profiles
- `followers` - Follow relationships
- `posts` - User posts
- `likes` - Post likes
- `comments` - Post comments
- `bookmarks` - Saved posts
- `messages` - Direct messages
- `stories` - Ephemeral stories
- `notifications` - User notifications

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Optional |
| `FRONTEND_URL` | Frontend application URL | Yes |
| `JWT_SECRET` | Secret for JWT signing | Recommended |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [Supabase](https://supabase.io/)
- [PostgreSQL](https://www.postgresql.org/)

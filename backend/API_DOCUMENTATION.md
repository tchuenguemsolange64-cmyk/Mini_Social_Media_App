# Mini Social Media App - API Documentation

Base URL: `/api`

## Authentication

### Sign Up
`POST /auth/signup`
- **Body**: `{ "email": "user@example.com", "password": "password", "username": "user123", "display_name": "User Name" }`
- **Response**: `201 Created`
  - Returns user object and session.

### Login
`POST /auth/login`
- **Body**: `{ "email": "user@example.com", "password": "password" }`
- **Response**: `200 OK`
  - Returns user object and session.

### Get Current User
`GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
  - Returns current user profile.

---

## Posts

### Get Feed
`GET /posts/feed`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `limit`, `offset`
- **Response**: `200 OK`
  - Returns list of posts from followed users.

### Create Post
`POST /posts`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "content": "Hello World", "media_urls": [], "visibility": "public", "tags": [] }`
- **Response**: `201 Created`

### Get Post by ID
`GET /posts/:postId`
- **Response**: `200 OK`

### Delete Post
`DELETE /posts/:postId`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Like Post
`POST /posts/:postId/like`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## Users

### Get User Profile
`GET /users/:identifier` (username or ID)
- **Response**: `200 OK`

### Update Profile
`PUT /users/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "display_name": "New Name", "bio": "New Bio", ... }`
- **Response**: `200 OK`

### Follow User
`POST /users/:userId/follow`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## Comments

### Get Comments for Post
`GET /posts/:postId/comments`
- **Query Params**: `limit`, `offset`
- **Response**: `200 OK`

### Add Comment
`POST /posts/:postId/comments`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "content": "Nice post!", "parent_id": null }`
- **Response**: `201 Created`

---

## Messages

### Send Message
`POST /messages/:recipientId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "content": "Hello!" }`
- **Response**: `201 Created`

### Get Conversations
`GET /messages/conversations`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Get Conversation Messages
`GET /messages/conversation/:userId`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `limit`, `offset`
- **Response**: `200 OK`

---

## Stories

### Create Story
`POST /stories`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "media_url": "...", "media_type": "image", "caption": "...", "duration": 24 }`
- **Response**: `201 Created`

### Get Feed Stories
`GET /stories/feed`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
  - Returns active stories from followed users.

---

## Upload

### Upload Avatar
`POST /upload/avatar`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**: Form data with `avatar` file.
- **Response**: `200 OK`
  - Returns `{ "url": "..." }`

### Upload Post Media
`POST /upload/post`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**: Form data with `files` (multiple).
- **Response**: `200 OK`
  - Returns `{ "urls": [...] }`

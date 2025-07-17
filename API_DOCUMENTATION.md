# Video Comments and Watch History API Documentation

## Comments API

### Add Comment to Video
**POST** `/api/comments/video/:videoId`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "This is a great video!",
  "parentCommentId": "optional_parent_comment_id_for_replies"
}
```

**Response:**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "_id": "comment_id",
    "content": "This is a great video!",
    "author": {
      "_id": "user_id",
      "username": "john_doe",
      "avatar": "avatar_url"
    },
    "video": "video_id",
    "parentComment": null,
    "likes": 0,
    "createdAt": "2025-07-17T10:00:00.000Z",
    "updatedAt": "2025-07-17T10:00:00.000Z"
  }
}
```

### Get Video Comments
**GET** `/api/comments/video/:videoId?page=1&limit=20&sortBy=createdAt`

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Comments per page (default: 20)
- `sortBy` (optional): Sort field (default: createdAt)

**Response:**
```json
{
  "comments": [
    {
      "_id": "comment_id",
      "content": "Great video!",
      "author": {
        "_id": "user_id",
        "username": "john_doe",
        "avatar": "avatar_url"
      },
      "video": "video_id",
      "parentComment": null,
      "likes": 5,
      "createdAt": "2025-07-17T10:00:00.000Z",
      "updatedAt": "2025-07-17T10:00:00.000Z",
      "replies": [
        {
          "_id": "reply_id",
          "content": "I agree!",
          "author": {
            "_id": "user_id_2",
            "username": "jane_doe",
            "avatar": "avatar_url_2"
          },
          "parentComment": "comment_id",
          "likes": 2,
          "createdAt": "2025-07-17T10:05:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Update Comment
**PUT** `/api/comments/:commentId`

**Authentication:** Required (must be comment author)

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:**
```json
{
  "message": "Comment updated successfully",
  "comment": {
    "_id": "comment_id",
    "content": "Updated comment content",
    "author": {
      "_id": "user_id",
      "username": "john_doe",
      "avatar": "avatar_url"
    },
    "likes": 5,
    "createdAt": "2025-07-17T10:00:00.000Z",
    "updatedAt": "2025-07-17T10:30:00.000Z"
  }
}
```

### Delete Comment
**DELETE** `/api/comments/:commentId`

**Authentication:** Required (must be comment author)

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

### Like/Unlike Comment
**POST** `/api/comments/:commentId/like`

**Authentication:** Required

**Request Body:**
```json
{
  "action": "like"  // or "unlike"
}
```

**Response:**
```json
{
  "message": "Comment liked successfully",
  "likes": 6
}
```

## Watch History API

### Add Video to Watch History
**POST** `/api/videos/:videoId/watch`

**Authentication:** Required

**Request Body:**
```json
{
  "watchDuration": 120  // seconds watched (optional)
}
```

**Response:**
```json
{
  "message": "Added to watch history"
}
```

### Get User's Watch History
**GET** `/api/videos/watch-history/user?page=1&limit=20`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Videos per page (default: 20)

**Response:**
```json
{
  "watchHistory": [
    {
      "video": {
        "_id": "video_id",
        "title": "Amazing Video",
        "description": "This is an amazing video",
        "thumbnailUrl": "thumbnail_url",
        "duration": 300,
        "views": 1500,
        "uploader": "content_creator",
        "createdAt": "2025-07-17T09:00:00.000Z"
      },
      "watchedAt": "2025-07-17T10:30:00.000Z",
      "watchDuration": 120
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### Clear Watch History
**DELETE** `/api/videos/watch-history/clear`

**Authentication:** Required

**Response:**
```json
{
  "message": "Watch history cleared successfully"
}
```

### Remove Specific Video from Watch History
**DELETE** `/api/videos/watch-history/:videoId`

**Authentication:** Required

**Response:**
```json
{
  "message": "Video removed from watch history"
}
```

## Updated Video Model

The Video model now includes a `commentsCount` field:

```json
{
  "_id": "video_id",
  "title": "Video Title",
  "description": "Video description",
  "duration": 300,
  "fileUrl": "path/to/video.mp4",
  "thumbnailUrl": "path/to/thumbnail.jpg",
  "uploader": "username",
  "views": 1500,
  "likes": 75,
  "commentsCount": 23,
  "createdAt": "2025-07-17T09:00:00.000Z",
  "updatedAt": "2025-07-17T10:00:00.000Z"
}
```

## Updated User Model

The User model now includes watch history:

```json
{
  "_id": "user_id",
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "avatar_url",
  "watchHistory": [
    {
      "video": "video_id",
      "watchedAt": "2025-07-17T10:30:00.000Z",
      "watchDuration": 120
    }
  ],
  "createdAt": "2025-07-17T08:00:00.000Z",
  "updatedAt": "2025-07-17T10:30:00.000Z"
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

# Testing the New Features

## Comments and Watch History Testing Guide

### Prerequisites
1. Make sure the server is running (`npm run dev`)
2. Have a valid user account and authentication token
3. Have at least one video uploaded

### Testing Comments

#### 1. Add a Comment
```bash
curl -X POST http://localhost:8000/api/comments/video/VIDEO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "This is a test comment!"
  }'
```

#### 2. Get Video Comments
```bash
curl -X GET http://localhost:8000/api/comments/video/VIDEO_ID
```

#### 3. Add a Reply to a Comment
```bash
curl -X POST http://localhost:8000/api/comments/video/VIDEO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "This is a reply!",
    "parentCommentId": "PARENT_COMMENT_ID"
  }'
```

#### 4. Like a Comment
```bash
curl -X POST http://localhost:8000/api/comments/COMMENT_ID/like \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "like"
  }'
```

#### 5. Update a Comment
```bash
curl -X PUT http://localhost:8000/api/comments/COMMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Updated comment content"
  }'
```

#### 6. Delete a Comment
```bash
curl -X DELETE http://localhost:8000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Testing Watch History

#### 1. Add Video to Watch History
```bash
curl -X POST http://localhost:8000/api/videos/VIDEO_ID/watch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "watchDuration": 120
  }'
```

#### 2. Get Watch History
```bash
curl -X GET http://localhost:8000/api/videos/watch-history/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Remove Video from Watch History
```bash
curl -X DELETE http://localhost:8000/api/videos/watch-history/VIDEO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. Clear Watch History
```bash
curl -X DELETE http://localhost:8000/api/videos/watch-history/clear \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Getting Your Token

If you need to get an authentication token, first login:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

The response will include a token that you can use for authenticated requests.

### Expected Responses

All successful requests should return appropriate JSON responses as documented in the API documentation. Error responses will include meaningful error messages and appropriate HTTP status codes.

### Database Verification

You can verify the data is being stored correctly by checking your MongoDB database:

1. **Comments Collection**: Should contain comment documents with author, video, and content references
2. **Users Collection**: Should have `watchHistory` arrays populated with video references and timestamps
3. **Videos Collection**: Should have updated `commentsCount` fields

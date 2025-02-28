# Add Comment Controller Steps

1. Extract videoId from request parameters
2. Extract content from request body
3. Get current user's ID
4. Validate videoId is a valid MongoDB ObjectId
5. Validate comment content is not empty
6. Create new Comment document in database
7. Validate comment creation was successful
8. Return success response with comment details
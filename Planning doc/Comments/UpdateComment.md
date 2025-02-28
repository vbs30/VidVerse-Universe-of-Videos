# Update Comment Controller Steps

1. Extract commentId from request parameters
2. Extract content from request body
3. Get current user's ID
4. Validate commentId is a valid MongoDB ObjectId
5. Check if comment exists in database
6. Update comment content where ID matches and user is owner
7. Validate update was successful
8. Return success response with updated comment
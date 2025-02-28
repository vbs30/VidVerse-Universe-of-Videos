# Delete Comment Controller Steps

1. Extract commentId from request parameters
2. Get current user's ID
3. Validate commentId is a valid MongoDB ObjectId
4. Check if comment exists in database
5. Delete comment where ID matches and user is owner
6. Validate deletion was successful
7. Return success response with deleted comment details
## Steps Performed

1. Retrieve `tweetId` from the request parameters and `content` from the request body.
2. Validate whether the provided `tweetId` is a correct MongoDB ObjectId.  
   - If not valid, throw an error: `"Specified wrong tweet-id"`.
3. Check if the `content` field is provided.  
   - If missing, throw an error: `"Please enter content to update"`.
4. Use a single database query to find the tweet by its ID and ensure the current user is the tweet's owner.  
   - If both conditions match, update the tweet’s `content` field.
5. If no tweet is found or updated, throw an error:  
   `"Tweet was not updated, either there is no such tweet or you are not the creator of it or there is some technical issue"`.
6. If the tweet is updated successfully, return a 201 status response with:  
   - Updated tweet details  
   - Success message: `"Tweet updated successfully"`
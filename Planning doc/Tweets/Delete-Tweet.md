## Steps Performed

1. Retrieve `tweetId` from the request parameters.
2. Validate whether the provided `tweetId` is a correct MongoDB ObjectId.  
   - If not valid, throw an error: `"Specified wrong tweet-id"`.
3. Use a single database query to find and delete the tweet by its ID, ensuring the current user is the tweet's owner.
4. If no tweet is found or deleted, throw an error:  
   `"Tweet was not deleted, either there is no such tweet or you are not the creator of it or there is some technical issue"`.
5. If the tweet is deleted successfully, return a 201 status response with a success message:  
   `"Tweet deleted successfully"`.
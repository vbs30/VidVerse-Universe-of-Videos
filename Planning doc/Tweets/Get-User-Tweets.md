## Steps Performed

1. Extract User ID: Retrieve the currently logged-in user's ID from req.user._id.
2. Fetch User's Tweets: Query the Tweet collection to find all tweets where ownerId matches the user’s ID.
3. Handle Missing Tweets: If no tweets are found, return an error response.
4. Return Response: If tweets are found, return a success response with the tweet details.
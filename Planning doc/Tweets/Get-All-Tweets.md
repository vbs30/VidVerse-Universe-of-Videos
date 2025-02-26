## Steps Performed

1. Retrieve all tweets using the `find({})` method.
2. If no tweets are found or an error occurs, throw an error:  
   `"Something went wrong while fetching all the tweets"`.
3. If tweets are successfully fetched, return a 201 status response with:  
   - The list of tweets  
   - Success message: `"Tweets fetched successfully"`
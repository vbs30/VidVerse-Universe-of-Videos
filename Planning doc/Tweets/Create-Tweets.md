## Steps Performed

1. Extract the ownerId, ownerName, and content from the request.
2. Check if content is provided:
- If not, throw an error with status 401.
3. Create a new tweet document with content, ownerId, and ownerName.
4. Check if the tweet creation was successful:
- If not, throw an error with status 401.
5. Return a success response with a 201 status code and a success message.
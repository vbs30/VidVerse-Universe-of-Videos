# Update Playlist By ID Controller Steps

1. Extract playlistId from request parameters
2. Extract name and description from request body
3. Get current user's ID
4. Validate playlistId format
5. Create empty update object
6. Add name to update object if provided
7. Add description to update object if provided
8. Validate at least one field is being updated
9. Update playlist document where ID matches and user is owner
10. Validate update was successful
11. Return updated playlist details
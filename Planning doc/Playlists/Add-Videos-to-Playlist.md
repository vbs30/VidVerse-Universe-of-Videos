# Add Videos To Playlist Controller Steps

1. Extract videoId and playlistId from request parameters
2. Get current user's ID
3. Validate videoId and playlistId formats
4. Check if video exists in database
5. Check if playlist exists in database
6. Verify video is not already in playlist
7. Update playlist by pushing videoId to videos array
8. Validate update was successful
9. Return updated playlist videos array

## Bugs Found and Fixed

**Bug 1**: Non-existent videos were being saved to playlists
- Fix: Added validation to check if video actually exists in the database before adding it
```javascript
const isVideoExisting = await Video.findById(videoId)
if (!isVideoExisting) {
    throw new ApiError(401, "Video does not exist anywhere")
}
```

**Bug 2**: Video IDs were being updated instead of added
- Fix: Used `$push` operator instead of `$set` to append video IDs to the array
```javascript
// Bug: Using $set would overwrite the entire videos array
// Fixed by using $push to add to the existing array
const playlistDetails = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    {
        $push: {
            videos: videoId
        }
    },
    { new: true }
)
```

**Bug 3**: Duplicate videos could be added to playlists
- Fix: Added validation to check if video is already in the playlist
```javascript
if (isPlaylistExisting.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in the playlist");
}
```
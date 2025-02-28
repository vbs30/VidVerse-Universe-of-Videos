# Get Playlist By ID Controller Steps

1. Extract playlistId from request parameters
2. Validate playlistId is a valid MongoDB ObjectId
3. Use aggregation pipeline to:
   - Match playlist by ID
   - Lookup video details from videos collection
   - Add videoCount field
   - Project required fields
4. Validate playlist was found
5. Return playlist details with video information

## Aggregation Pipeline Code

```javascript
const playlistDetails = await Playlist.aggregate([
    {
        // Match the Playlist collection's id with playlistId from URL parameter
        $match: {
            _id: new mongoose.Types.ObjectId(playlistId)
        }
    },
    {
        // Join Video collection with Playlist collection where Playlist.videos = Videos._id
        $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "video_details"
        }
    },
    {
        // Add a field to count videos in the playlist
        $addFields: {
            videoCount: {
                $size: "$video_details"
            }
        }
    },
    {
        // Project only the needed fields
        $project: {
            name: 1,
            description: 1,
            owner: 1,
            createdAt: 1,
            updatedAt: 1,
            videoCount: 1,
            video_details: 1
        }
    }
]);
```

### Explanation:
- `$match`: Filters the Playlist collection to find the specific playlist by ID
- `$lookup`: Performs a left outer join with the Video collection to get complete video information
- `$addFields`: Creates a new field that counts the number of videos in the playlist
- `$project`: Specifies which fields to include in the final output
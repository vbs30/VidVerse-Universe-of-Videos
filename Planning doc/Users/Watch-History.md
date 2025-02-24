# Get Watch History API

## Steps or Workflow of the Code
1. Match the current user by their `_id`.
2. Join the `Users` collection with the `Videos` collection using the user’s `watchHistory` field.
3. In the `watchHistory` array, fetch video details where the video’s `_id` matches the user's watch history.
4. For each video, use a sub-pipeline to join the `Users` collection again to get the video owner’s details.
5. Extract only the `fullName`, `username`, and `avatar` of the video owner.
6. Flatten the owner array to a single object for each video entry.
7. Return the user’s watch history, which contains an array of videos with their owner information.

## Why Are We Doing This
This API fetches the complete watch history of a user in an optimized and structured way. Using MongoDB aggregation:
- We avoid multiple queries by joining collections and transforming data in a single query.
- It enhances performance and reduces server load.
- The result is well-structured, providing video details alongside their respective owner information.

## Pipeline Explanation
```javascript
const user = await User.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user._id) // Match the current user by their ID
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory", // Array of video IDs user has watched
            foreignField: "_id", // Match video IDs
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner", // Video's owner (user ID)
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: { // Only include owner's name, username, and avatar
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        owner: { $first: "$owner" } // Flatten owner array to a single object
                    }
                }
            ]
        }
    }
]);
```

**Stages:**
- $match: Filters the current user by their unique _id.
- $lookup (Outer): Joins Users with Videos to fetch the user’s watch history.
- $lookup (Inner): Joins each video with Users again to fetch video owner details.
- $project: Selects only required fields for the video owner.
- $addFields: Flattens the owner array to a single object for simplicity.


## Equivalent SQL Query
```sql
SELECT 
    v.id AS videoId,
    v.title,
    v.description,
    v.owner,
    u2.fullName AS ownerFullName,
    u2.username AS ownerUsername,
    u2.avatar AS ownerAvatar
FROM Users u
JOIN Videos v
    ON v.id IN (
        SELECT videoId
        FROM WatchHistory
        WHERE userId = @currentUserId
    )
JOIN Users u2
    ON v.owner = u2.id;
```

This SQL query mimics the MongoDB aggregation pipeline, joining Users with Videos and then joining Videos with the Users table again to fetch owner details.
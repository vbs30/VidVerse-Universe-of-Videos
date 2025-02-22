# Get User Channel Profile API



## Steps or Workflow of the Code
1. Extract `username` from request parameters.
2. Validate that the `username` is not empty or missing.
3. Match the `username` with the corresponding user in the `Users` collection.
4. Join the `Users` collection with the `Subscriptions` collection to get the list of subscribers (`subscribers` array).
5. Join the `Users` collection with the `Subscriptions` collection to get the list of channels the user has subscribed to (`subscribedTo` array).
6. Add custom fields:
   - `subscribersCount`: Count of subscribers.
   - `channelSubscriptionCount`: Count of channels the user subscribed to.
   - `isSubscribed`: Boolean indicating if the current user is subscribed to this channel.
7. Project the final fields to include only required user information.
8. If no channel is found, throw an error.
9. If channel exists, return user details with subscription info.




## Why Are We Doing This
This API fetches user channel profile details in an optimized and structured way. Using MongoDB aggregation, we:
- Avoid multiple queries by joining collections and transforming data in a single query.
- Enhance performance and reduce server load.
- Provide complete and well-structured data for the frontend with minimal API calls.



## Pipeline Explanation
```javascript
const channel = await User.aggregate([
    {
        $match: { username: username?.toLowerCase() }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channelSubscribed",
            as: "subscribers"
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subscribersCount: { $size: "$subscribers" },
            channelSubscriptionCount: { $size: "$subscribedTo" },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            username: 1,
            email: 1,
            avatar: 1,
            subscribersCount: 1,
            channelSubscriptionCount: 1,
            isSubscribed: 1
        }
    }
])
```


**Stages:**
- `$match`: Filters users by matching the username.
- `$lookup`: Joins the `subscriptions` collection twice to get subscribers and subscriptions.
- `$addFields`: Adds calculated fields like subscriber count, channel subscription count, and subscription status.
- `$project`: Limits the output fields to only necessary data.



## Equivalent SQL Query
```sql
SELECT
    u.username,
    u.email,
    u.avatar,

    -- Count of subscribers
    (SELECT COUNT(*) FROM Subscriptions s1 WHERE s1.channelSubscribed = u.id) AS subscribersCount,

    -- Count of channels the user has subscribed to
    (SELECT COUNT(*) FROM Subscriptions s2 WHERE s2.subscriber = u.id) AS channelSubscriptionCount,

    -- Check if the logged-in user is subscribed
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM Subscriptions s3
            WHERE s3.channelSubscribed = u.id
            AND s3.subscriber = @currentUserId
        ) THEN 1
        ELSE 0
    END AS isSubscribed

FROM Users u
WHERE LOWER(u.username) = LOWER(@username);
```

This SQL query mimics the aggregation pipeline by using subqueries and `CASE WHEN` to achieve the same result.


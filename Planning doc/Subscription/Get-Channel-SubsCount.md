# Get User Channel Subscribers API

## Steps or Workflow of the Code
1. Extract `channelName` from request parameters.
2. Validate if the `channelName` is not empty or missing.
3. Match the provided `channelName` with the `username` in the `Users` collection.
4. Join the `Users` collection with the `Subscriptions` collection:
   - Match `Users._id` with `Subscriptions.channelSubscribed`.
5. Add a new field `subscribersCount` by counting the size of the `subscribers` array.
6. Project only the `subscribersCount` field to keep the response clean.
7. Return the `subscribersCount` as a response.

## Why Are We Doing This
This API provides an efficient and optimized way to fetch the total number of subscribers a specific channel has. 

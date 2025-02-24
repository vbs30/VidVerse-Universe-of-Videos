# Get Subscribed Channels API

## Steps or Workflow of the Code
1. Extract `username` from request parameters.
2. Validate if the `username` is not empty or missing.
3. Match the provided `username` with the `username` in the `Users` collection.
4. Join the `Users` collection with the `Subscription` collection:
   - Match `Users._id` with `Subscription.subscriber`.
5. Add a new field `countOfChannels` by counting the size of the `subscribedTo` array.
6. Project only the necessary fields: `subscribedTo` and `username`.
7. Return the number of channels the user has subscribed to as a response.

## Why Are We Doing This
This API efficiently fetches the total number of channels a user has subscribed to

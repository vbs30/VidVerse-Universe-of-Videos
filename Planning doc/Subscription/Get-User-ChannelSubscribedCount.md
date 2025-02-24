# Get Subscribed Channels API

## Steps or Workflow of the Code

1. Extract username from request parameters.
2. Validate if the username is not empty or missing.
3. Match the provided username with the username in the Users collection.
4. Join the Users collection with the Subscription collection:
   - Match Users._id with Subscription.subscriber.
5. Flatten the subscribedTo array to access channelSubscribed field directly.
6. Join the Subscription.channelSubscribed field with the Users collection to fetch channel details.
7. Flatten the channelDetails array to access channel information directly.
8. Group results by user’s _id and:
   - Count total number of channels the user has subscribed to.
   - Collect and list the usernames of those channels.
9. Project only necessary fields: username, countOfChannels, and channels.
10. Return the total number of channels and their names in the response.

## Why Are We Doing This

This API efficiently fetches the total number of channels a user has subscribed to and provides the list of those channel usernames.


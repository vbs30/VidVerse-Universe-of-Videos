# Toggle Subscription API

## Steps or Workflow of the Code
1. Extract `channelId` from request parameters and get the `subscriberId` from the authenticated user.
2. Validate if the `channelId` is a valid identifier.
3. Ensure that a user cannot subscribe to their own channel by comparing `subscriberId` and `channelId`.
4. Check if a subscription already exists between the `subscriberId` and the `channelId`.
5. If the subscription exists:
   - Delete the subscription to indicate the user has unsubscribed.
   - Return a success response: `"Unsubscribed Successfully"`.
6. If the subscription does not exist:
   - Create a new subscription to indicate the user has subscribed.
   - Return a success response: `"Subscribed Successfully"`.

## Why Are We Doing This
This API enables users to easily subscribe or unsubscribe from a channel with a single request. It:
- Ensures users cannot subscribe to their own channel.
- Checks if the subscription already exists to decide the appropriate action.
- Deletes or creates a subscription document to reflect the user's intent.
- Provides clear and immediate feedback on the action performed.

## User Logout Flow with Refresh Token Invalidation



1. To logout, we need to clear (delete) the existing refresh token in db, so that next time, without actual login, you should not access pages directly
2. when returning, if cookies are cleared as well as db refresh token is cleared, then we can say that logged out is successful
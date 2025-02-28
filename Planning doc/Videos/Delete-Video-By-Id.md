# Delete Video Controller Steps

1. Extract videoId from request parameters
2. Retrieve video document from database
3. Validate videoId format
4. Extract Cloudinary public ID from video URL
5. Delete video file from Cloudinary
6. Delete video document from database
7. Validate deletion was successful
8. Return success response
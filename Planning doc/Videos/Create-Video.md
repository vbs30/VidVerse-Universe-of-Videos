# Create Video Controller Steps

1. Extract title, description, and duration from request body
2. Validate that all required fields are provided
3. Get current user's ID and username
4. Get video file path and thumbnail image path
5. Validate both files were uploaded correctly
6. Upload video to Cloudinary
7. Upload thumbnail to Cloudinary
8. Create new Video document in database with all details
9. Validate database operation succeeded
10. Return success response with video details
# Update Video Details Controller Steps

1. Extract videoId, title, description, thumbnail path, and video file path
2. Validate videoId format
3. Retrieve existing video document from database
4. Create empty update fields object
5. Add title and description to update object if provided
6. If new thumbnail provided:
   - Delete old thumbnail from Cloudinary
   - Upload new thumbnail to Cloudinary
   - Add new thumbnail URL to update object
7. If new video file provided:
   - Delete old video from Cloudinary
   - Upload new video to Cloudinary
   - Add new video URL to update object
8. Validate at least one field is being updated
9. Update database record with new values
10. Return updated video document
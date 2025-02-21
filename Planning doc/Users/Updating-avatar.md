# Steps to update avatar image at database and cloudinary



1. Get new avatar file path given by user and check if file is fetched or not
2. If avatar file is obtained, upload to cloudinary and get it's url, if url is not obtained, throw an error.
3. If avatar url is obtained by coudinary, update the avatar url in db with this url and send response of successful updation.

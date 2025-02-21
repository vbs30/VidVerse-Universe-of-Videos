# Steps to update cover image at database and cloudinary



1. Get new cover image file path given by user and check if file is fetched or not
2. If cover image file is obtained, upload to cloudinary and get it's url, if url is not obtained, throw an error.
3. If cover image url is obtained by coudinary, update the cover image url in db with this url and send response of successful updation.

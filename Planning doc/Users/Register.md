## User Registration Flow with Validation and Cloudinary Upload



1. Get user details.
2. All validations when details are obtained ( not empty ).
3. Check whether user is already registers ( username, email ).
4. Check avtar and cover-image ( it is required ).
    i. If avtar and cover-iamge present, then upload it to cloudinary.
   ii. Check whether cloudinary has got these things or not.
5. Create user object that will be stored in DB ( creating entry in db ).
6. Remove pwd and refresh token from response ( not to be visible by users ).
    i. Check if user is created, if yes then return response.
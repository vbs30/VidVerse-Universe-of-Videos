# Steps to update user password



1. Get passwords from user.
2. Get user details, if user is logged in, by req.user we will get current user with it's id.
3. Check if your current or old password is correct by using isPasswordCorerect() which will compare password with stored password in db, return true or false.
4. If password does not match, throw error.
5. Check if user is confirmed that he wants that password.
6. Once you get new password, save it in db and return a response.

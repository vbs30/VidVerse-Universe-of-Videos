## User Login Flow with Validation, Password Verification, and JWT Authentication



1. Get User details
2. check if username or password is empty, if not then throw an error
3. check if given username or email matches the ones in db or not, if not then throw error
4. if username or email matches, check the obtained password with isPasswordCorrect function (will compare password from database and entered at login, return true or false)
5. if false is returned, then we can say that password does not match and throw an error based on it
6. If everything matches, then generate an access token and refresh token so that once login is done, with the help of cookie we can skip regular logins and jwt token will make us login directly 
7. set options to be passed in cookies, combination is typically used to enhance cookie security in web applications.
8. send response as user is logged in with passing cookies(Access Token, Refresh Token) to cookieStorage
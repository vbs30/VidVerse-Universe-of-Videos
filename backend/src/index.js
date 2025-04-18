import connectDB from './db/index.js';
import dotenv from 'dotenv'
import { app } from './app.js';

/*
documentation way of connecting .env with project file
require('dotenv).config({path: './env})
*/

//In file we are using import statements, and using required makes the flow dirty, so by modern way, we can do this as: 

dotenv.config({
    path: './env'
})

connectDB().then(
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running at port: ${process.env.PORT}`)
    })
).catch((err) => {
    console.log("MongoDB connection failed, ", err)
})
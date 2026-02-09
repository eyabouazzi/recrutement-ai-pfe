const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();
const dbCon = process.env.MONGO_URL;
mongoose.connect(dbCon).then(() => {
    console.log("DataBase connected successfully")
}).catch((err) => {
    console.log("Database connection failed")
    console.log(err)
})

app.listen(3000, () => {
    console.log("Server is working on port 3000")
})

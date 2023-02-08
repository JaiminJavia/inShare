require('dotenv').config();
const mongoose = require('mongoose');
//importing the packages

function  connectDB(){
    //database connection
    mongoose.set('strictQuery', true);
    mongoose.connect(process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    //useFindAndModify: false,
    useUnifiedTopology: true
  });
  mongoose.connection
  .once('open', () =>{
    console.log('Database connected successfully')
  })
  .on('error', function (err) {
    console.log(err);
  })
}

module.exports = connectDB;
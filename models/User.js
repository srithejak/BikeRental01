
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    phone:{type:String, required: true, unique: true},
    firstName: {type:String},
    lastName:{type:String},
    email: {type:String, unique: true}
})

module.exports = mongoose.model('User',userSchema)

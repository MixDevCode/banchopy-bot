const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    username: String,
    userID: String
})

module.exports = mongoose.model('osuUsers', schema);
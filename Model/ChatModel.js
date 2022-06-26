var mongoose = require('mongoose');

var ChatSchema = mongoose.Schema({
    name: String,
    id: String,
    isconnected: Boolean,
    }, {
        timestamps: true
});

module.exports = mongoose.model("Chats",ChatSchema);
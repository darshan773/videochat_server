var mongoose = require('mongoose');

var RegionSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('RegionList',RegionSchema);
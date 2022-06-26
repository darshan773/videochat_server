var mongoose = require('mongoose');

var historySchema = mongoose.Schema({

    userId:{
        type:String,
        required:true
    },
    clientId:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    country:{
        type:String,
    },
    name:{
        type:String,
        required:true
    },
    created:{
        type:String,
        require:true
    }
    
},{
    timestamps: true
});

module.exports = mongoose.model("History", historySchema);
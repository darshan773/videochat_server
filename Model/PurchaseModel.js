var mongoose = require('mongoose');

var PurchaseSchema = mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Users'
        },
        gemsId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'GemsList'
        },
        packageName:{
            type:String,
            required:true
        },
        orderId:{
            type:String,
            required:true
        },
        signature:{
            type:String,
            required:true
        },
        token:{
            type:String,
            required:true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('PurchaseList',PurchaseSchema);
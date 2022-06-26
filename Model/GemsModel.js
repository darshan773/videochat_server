const mongoose = require('mongoose');

var GemsSchema = mongoose.Schema({
    coins: {
        type: Number,
        required: true,
        unique: true
    },
    subId: {
        type: String,
        required: true
    },
    isBest: {
        type: Boolean,
        required: true,
        default: false
    }

});

var GemsModel = mongoose.model("GemsList", GemsSchema);
GemsModel.remove({},(err) => {
    if(!err){
        new GemsModel({ coins: 500, subId: "item_coins_500", idBest: false }).save();
        new GemsModel({ coins: 1200, subId: "item_coins_1200", idBest: true }).save();
        new GemsModel({ coins: 2500, subId: "item_coins_2500", idBest: false }).save();
    }
});

module.exports = GemsModel;
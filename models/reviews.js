const mongoose = require("mongoose");

var schema = new mongoose.Schema({

	message: {type: String},
	order_id: {type: mongoose.ObjectId, required: true},
	tailor_id: {type: mongoose.ObjectId, required: true},
	user_id: {type: mongoose.ObjectId, require: true},
	rating: {type: Number, max: 5, min: 0},
	date: Date

})

module.exports.review = mongoose.model("reviews", schema);
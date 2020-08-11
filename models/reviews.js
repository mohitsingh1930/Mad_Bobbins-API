const mongoose = require("mongoose");

var schema = new mongoose.Schema({

	message: {type: String},
	order_instance_id: {type: mongoose.Types.ObjectId, required: true},
	tailor_id: {type: mongoose.ObjectId, required: true},
	user_id: {type: mongoose.ObjectId, required: true},
	rating: {type: Number, max: 5, min: 0},
	date: {type: Date, default: new Date()}

})

module.exports = mongoose.model("reviews", schema);
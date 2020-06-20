const mongoose = require("mongoose")

var schema = mongoose.Schema({

	name: String,
	description: String,
	images: {
		mini: [String],
		original: [String]
	},
	actual_price: {
		type: Number,
		min: 0,
		required: true
	},
	discounted_price: {
		type: Number,
		min: 0,
		required: true
	},
	uploaded_date: {
		type: Date,
		default: Date.now()
	},
	active: {
		type: Boolean,
		default: true
	}

})
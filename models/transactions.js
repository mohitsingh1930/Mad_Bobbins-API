const mongoose = require("mongoose")

var schema = mongoose.Schema({

	mode: {
		type: String,
		enum: ["cash", "UPI", "wallet", "internet banking"],
		required: true
	},
	from: {
		type: {
			type: String,
			enum: ["tailor", "user", "ARLORS", "pickup boy", "delievery boy"],
			required: true
		},
		id: {
			type: mongoose.ObjectId,
			required: true
		}
	},
	to: {
		type: {
			type: String,
			enum: ["tailor", "user", "ARLORS", "pickup boy", "delievery boy"],
			required: true
		},
		id: {
			type: mongoose.ObjectId,
			required: true
		}
	},
	date: {type: Date, default: Date.now(), required: true},
	invoice: {},
	amount: {
		type: Number,
		required: true,
		min: 0
	},
	status: {
		value: {type: Boolean, required: true},
		cancellation_reason: String
	}

})


module.exports.transaction = mongoose.model("transactions", schema)
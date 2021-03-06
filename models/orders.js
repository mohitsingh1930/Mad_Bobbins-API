const mongoose = require("mongoose");


var schema = mongoose.Schema({

	order_id: {
		type: String		//design for self increment
	},
	product: {
		type: {type: String, enum: ["basic", "catalog"], required: true},
		id: {type: Number, required: true, ref: "products"},
		image: String,
		imageStream: String
	},
	user_id: {type: mongoose.ObjectId, required: true},
	tailor_id: {type: mongoose.ObjectId},
	address_id: {type: mongoose.ObjectId},
	dates: {
		order: {type: Date, required: true, default: new Date()},
		pickup: {type: Date, required: true, default: new Date()},
		delivery: {type: Date}
	},
	arrangement_id: {
		type: mongoose.ObjectId,
		required: true
	},
	tailor_dates: {
		start: Date,
		end: Date
	},
	status: {
		type: String,
		enum: ["pending", "picked", "assigned", "completed", "out", "delivered", "returned", "cancelled"],
		required: true,
		default: "pending"
	},
	movements: {
		picked: {
			otp: {type: Number, max:9999, min:1000},
			date: Date,
			checked: {type: Boolean, required: true, default: false}
		},
		assigned: {
			otp: {type: Number, max:9999, min:1000},
			date: Date,
			checked: {type: Boolean, required: true, default: false}
		},
		out: {
			otp: {type: Number, max:9999, min:1000},
			date: Date,
			checked: {type: Boolean, required: true, default: false}
		},
		delivered: {
			otp: {type: Number, max:9999, min:1000},
			date: Date,
			checked: {type: Boolean, required: true, default: false}
		}
	},
	extras: [
		{
			type: {type: String},
			id: {type: "Mixed"},
			price_id: {type: mongoose.ObjectId, ref: "prices"}
		}
	],
	payment: {
		price_id: {type: mongoose.ObjectId, ref: "prices"},
		design_price: Number,
		current_price: Number,
		prepaid: Boolean,
		transaction_id: mongoose.ObjectId
	},
	active: {
		status: {type: "Mixed", enum: [1, 0, "cancelled"], default: 1},
		cancel: {
			date: Date,
			reason: String
		}
	},
	pickup_id: {type: mongoose.ObjectId},
	deliver_id: {type: mongoose.ObjectId},
	temp_id: {type: mongoose.ObjectId, ref: "temporary_users"},
	measurements: {
		top: {
			"length": String,
			"teera": String,
			"waist": String,
			"hip": String,
			"sleeves length": String,
			"sleeves botton": String,
			"front neck": String,
			"back neck": String,
			"armole": String,
			"breast": String,
			"tummy": String,
			"bisceps": String,
			"dot point": String,
			"dot distance": String
		},
		bottom: {
			"length": String,
			"hip": String,
			"bottom": String,
			"bottom width": String,
			"thigh": String,
			"waist": String,
			"knee": String,
			"calves": String
		},
		blouse: {
			"length": String,
			"sleeves length": String,
			"sleeves bottom": String,
			"waist": String,
			"across back": String,
			"armole": String,
			"breast": String,
			"dot distance": String,
			"dot point": String,
			"teera": String,
			"front neck": String,
			"back neck": String,
			"bisceps": String,

		}
	},

	pickup_demand: {
		type: String,
		enum: ["cloth", "measurements", "none"],
		required: true
	},

	description: String,

	return: {
		reason: String,
		status: Boolean,
		reference: mongoose.ObjectId
		// date: Date
	}

})


module.exports.order = mongoose.model("orders", schema)
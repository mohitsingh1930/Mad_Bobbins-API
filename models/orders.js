const mongoose = require("mongoose");


var schema = mongoose.Schema({

	order_id: {
		type: String		//design for self increment
	},
	product: {
		type: {type: String, enum: ["basic", "catalog"], required: true},
		id: {type: Number, required: true, ref: "products"},
		image: String
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
			"length": Number,
			"teera": Number,
			"Upper chest": Number,
			"middle chest": Number,
			"lower chest": Number,
			"waist": Number,
			"hip": Number,
			"sleeves length": Number,
			"sleeves botton": Number,
			"front neck": Number,
			"back neck": Number,
			"armole": Number
		},
		bottom: {
			"length": Number,
			"hip": Number,
			"bottom": Number,
			"bottom width": Number,
			"thigh": Number,
			"waist": Number
		},
		blouse: {
			"length": Number,
			"upper chest": Number,
			"middle chest": Number,
			"lower chest": Number,
			"sleeves length": Number,
			"sleeves bottom": Number,
			"waist": Number,
			"across back": Number,
			"armole": Number
		}
	},

	description: String,

	return: {
		reason: String,
		status: Boolean,
		reference: mongoose.ObjectId
		// date: Date
	}

})

// schema.plugin(autoIncrement.plugin, {
// 	model: "orders",
// 	field: "order_id",
// 	startAt: 100
// })

module.exports.order = mongoose.model("orders", schema)
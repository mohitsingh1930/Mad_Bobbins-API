const mongoose = require("mongoose")


let schema = mongoose.Schema({
	tailor_id: {type: mongoose.ObjectId, ref: "tailors", required: true},
	product_id: {type: Number, ref: "products", required: true},
	amount: {type: Number, min: 0, required: true},
	date_added: {type: Date, default: Date.now()},
	active: {type: Boolean, default: true}
})

module.exports = mongoose.model("prices", schema)
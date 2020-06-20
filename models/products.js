const mongoose = require("mongoose")
const autoIncrement = require("mongoose-auto-increment")

var defaults = require("../errorHandlers").defaults

autoIncrement.initialize(mongoose.createConnection(defaults.DB_CONNECTION_STRING, {useUnifiedTopology: true, useNewUrlParser: true}))


var schema = mongoose.Schema({

	_id: {
		type: Number
	},
	name: {
		type: String,
		required: true
	},
	description: String,
	active: {
		type: Boolean,
		default: true
	},
	image: {
		type: String
	},
	coverage: [{type: String, enum: ["top", "bottom", "blouse"]}]

})


schema.plugin(autoIncrement.plugin, {
	model: "products",
	field: "_id",
	startAt: 1
})

module.exports.product = mongoose.model("products", schema)
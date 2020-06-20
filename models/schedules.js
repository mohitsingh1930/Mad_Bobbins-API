const mongoose = require("mongoose")


var schema = mongoose.Schema({

	date: {type: Date, required: true, default: new Date()},
	area: {type: String, required: true, enum: ["Burari"]},
	arrangements: [{
		start: {type: Number, min: 0, max: 24, required: true},
		end: {type: Number, min: 0, max: 24, required: true},
		pickup_id: [mongoose.ObjectId]
	}]

})


module.exports = mongoose.model("schedules", schema)
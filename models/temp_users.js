const mongoose = require("mongoose")


var schema = mongoose.Schema({
	name: {type: String},
	age: {type: Number, max:100},
	contact: {
		phone_no: {type: String, maxlength: 13},
		address: {
			loc: {
				type: {
					type: String,
					enum: ['Point'],
					default: 'Point'
				},
				coordinates: {type: [Number]} 		//longitude and latitude
			},
			text: {type: String}
		},
		email: {
			type: String
		}
	},
	date_created: {type: Date, default: new Date()}
})


module.exports = mongoose.model("temporary_users", schema)
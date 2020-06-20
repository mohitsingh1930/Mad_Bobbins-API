const mongoose = require("mongoose");

var schema = mongoose.Schema({

	name: {type: String},
	firebase_id: {type: String},
	contact: {
		phone_no: [{type: String, maxlength: 13}],
		address: [{
			loc: {
				type: {
					type: String,
					enum: ['Point'],
					default: 'Point'
				},
				coordinates: {type: [Number], required: false} 		//longitude and latitude
			},
			text: {type: String, required: false}
		}],
		email: {
			type: String,
			required: false
		}
	},
	date_joined: {
		type: Date,
		required: true,
		default: Date.now()
	},
	wallets: {},
	measurements: {

	}

})


module.exports.user = mongoose.model("users", schema)
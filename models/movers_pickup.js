const mongoose = require("mongoose")

var schema = mongoose.Schema({

	name: {type: String, required: true},
	contact: {
		phone_no: [{type: String, maxlength: 13}],
		address: [{
			loc: {
				type: {
					type: String,
					enum: ['Point'],
					default: 'Point'
				},
				coordinates: {type: [Number]} 		//longitude and latitude
			},
			text: {type: String}
		}],
		email: {
			type: String
		}
	},
	account: {
		total_earned: {type: Number, default: 0},					//can be calculated at instant
		month_earning: {type: Number, default: 0},				//but for avoid computation everytime
		due_to_receive: {type: Number, default: 0}				//update these everytime document gets updated
	},
	feedback: {
		reviews: [mongoose.ObjectId],
		overall_rating: {
			type: Number,
			max: 5,
			min: 0,
			default: null
		},
		reports: [mongoose.ObjectId]
	},
	date_joined: {type: Date, required: true, default: Date.now()},
	date_left: {type: Date},
	Wallets: {},
	active: {type: Boolean, required: true, default: true},

})


module.exports = mongoose.model("movers_pickup", schema);
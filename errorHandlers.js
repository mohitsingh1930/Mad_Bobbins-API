const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config()



module.exports.defaults = {
	DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
	MAXIMUM_SCHEDULE_PICKUP: process.env.MAXIMUM_SCHEDULE_PICKUP,
	ADMIN_AUTH_TOKEN: process.env.ADMIN_AUTH_TOKEN
}



mongoose.connect(process.env.DB_CONNECTION_STRING, {useUnifiedTopology: true, useNewUrlParser: true})


module.exports.toDate = (flutterDate) => {

	pickupDate = flutterDate.split(' ')[0].split('-');
	pickupDate = new Date(pickupDate[0], pickupDate[1]-1, pickupDate[2])

	return pickupDate

}

module.exports.slotsToString = (el) => {

	start = (el.start>12)?`${el.start-12} P.M.`:`${el.start} A.M.`;
	end = (el.end>12)?`${el.end-12} P.M.`:`${el.end} A.M.`;
	string = start + " - " + end
	return {id: el._id, start: el.start, end: el.end, string: string};

}


module.exports.checkMissing = arr => {

	for(let i=0; i<arr.length; i++) {
		if(typeof arr[i] === "undefined"){
			return i
		}
	}

	return false

}


module.exports.computeOrderStatus = (status, movements) => {

	let compute = {
		pending: "Confirmed",
		picked: movements.picked.checked?"Picked":"Confirmed",
		assigned: "Stitching in progress",
		completed: "Ready to dispatch",
		out: "Dispatched",
		delivered: "Delivered"
	}

	return compute[status];

}


module.exports.getWorker = function (type) {

	var tailor = require(__dirname + "/models/tailors")
	var delivery_client = require(__dirname + "/models/movers_delievery")
	var pickup_client = require(__dirname + "/models/movers_pickup")


	let model = {
		"delivery": delivery_client,
		"pickup": pickup_client,
		"tailor": tailor
	}

	if(!Object.keys(model).includes(type)) {
		return null;
	}

	return model[type]

}


module.exports.internalServerError = {
	status: 500,
	error_msg: "Internal server error"
}


module.exports.db_resolve = (result) => {
	console.log("Result:", result)
}

module.exports.db_reject = (err) => {
	console.log("<<<<<<<<<<<<ERROR\n", err)
}
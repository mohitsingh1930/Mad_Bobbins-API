var express = require('express');
var router = express.Router();

var order = require("../models/orders").order
var user = require("../models/users").user
var errorHandler = require("../errorHandlers")

/* GET users listing. */

router.post('/create', async (req, res) => {

	let userExists = await user.find({"contact.phone_no": req.body.phone_no}).exec()

	console.log(userExists)

	if(userExists.length != 0)
		return res.status(409).json({
			result: {
				msg: "Already present",
				userId: userExists[0]._id
			}
		})

	var new_user = new user({
		// name: req.body.name,
		firebase_id: req.body.firebase_id,
		contact: {
			phone_no: req.body.phone_no,
			// address: [{
			// 	loc: {
			// 		coordinates: [req.body.coordinates.longitude, req.body.coordinates.latitude]
			// 	},
			// 	text: req.body.address_text
			// }],
			// email: req.body.email
		},
	})

	let saved = new_user.save()
	saved
	.then((result) => {
		console.log("Result:", result)
		res.status(201).json({
			result: {
				msg: "User created",
				userId: result._id
			}
		})
	})
	.catch((err) => {
		console.log("Error:", err)
		res.status(500).json({
			error_msg: "Internal server error"
		})
	})

})


router.get("/orderDetails", (req, res) => {

	let query = {};
	query._id = req.params.userId;

	let intermediates = {};

	user.find(query, {wallets: 0, measurements: 0}).exec()
	.then((resolve, reject) => {

		intermediates.phone_no = resolve[0].contact.phone_no
		return order.find({_id: value, "active.status": {$ne: "cancelled"}}, {"temp_user": 1}).sort({"dates.order": -1})

	})
	.then((resolve, reject) => {

		res.json({
			status: 200,
			result: {
				phoneNumber: intermediates.phone_no,
				details: resolve
			}
		})
	})
	.catch((err) => {
		console.log("Error:", err);
		res.json(errorHandler.internalServerError)
	})

})


router.put("/orderDetails", (req, res) => {

	let details = req.body.order;

	let key = req.body.identifier;

	let query = {
		order_id: req.body.orderId
	};


	order.update(query, {$set: {"temp_user": {
		name: details.name,
		age: details.age,
		contact: {
			phone_no: details.phone_no,
			address: {
				text: details.addressText
			}
		}
	}}})
	.then((resolve, reject) => {
		console.log(resolve);
		res.json({
			status: 200,
			result: resolve
		})
	})
	.catch((err) => {
		console.log("Error:", err);
		res.json(errorHandler.internalServerError)
	})

})



module.exports = router;

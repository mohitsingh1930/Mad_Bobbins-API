const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const dateFns = require("date-fns")

var price = require("../models/prices")
var tailor = require("../models/tailors")
var delivery_client = require("../models/movers_delievery")
var pickup_client = require("../models/movers_pickup")

const { product } = require("../models/products")
var handler = require("../errorHandlers")



// create user, special only for admin
router.post("/create", (req, res) => {

	let {name, contact, type, authToken} = req.body;

	if(authToken !== handler.defaults.ADMIN_AUTH_TOKEN) {
		return res.status(401).json({
			error_msg: "Admin Only"
		})
	}

	let worker = handler.getWorker(type)
	if(!worker) {
		return res.status(406).json({
			error_msg: "Invalid worker type"
		})
	}

	worker.find({"contact.email": contact.email}).exec()
	.then(resolve => {

		if(resolve.length > 0) {

			res.status(409).json({
				error_msg: "Already exists"
			})

			throw `${type}: ${contact.email} Already exists`

		}

		return worker.create({
			name,
			contact: {
				email: contact.email,
				phone_no: contact.phone_no,
				address: {
					text: contact.address.text
				}
			}
		})

	})
	.then(resolve => {

		res.status(201).json({
			msg: "User successfully created",
			result: resolve
		})

	})
	.catch(err => {

		console.log(err)
		if(typeof err !== "string")
			res.status(500).json(handler.internalServerError)

	})

})



// Login Check
router.get("/details", (req, res) => {

	let clientType = req.query.clientType;
	let email = req.query.email;

	let worker = handler.getWorker(clientType);

	if(!worker) {
		return res.status(406).json({
			error_msg: "Invalid worker type"
		})
	}

	console.log(worker, email, clientType)

	worker.find({"contact.email": email}).exec()
	.then(resolve => {

		if(resolve.length === 0) {

			res.status(404).json({
				error_msg: "User not found"
			})

		} else {

			res.status(200).json({
				email: resolve[0].contact.email,
				userId: resolve[0]._id,
				role: clientType
			})

		}

	})
	.catch(err => {

		console.log(err)
		if(typeof err !== "string") {
			res.status(500).json(handler.internalServerError)
		}

	})

})



// tailors
router.post("/tailor/prices", (req, res) => {

	// console.log(req.body)
	let cartData = JSON.parse(req.body.cartData);


	let products = cartData.map(el => Number(el.productId))
	let quantities = cartData.map(el => el.quantity)
	let productNames = cartData.map(el => el.productName)

	// console.log(products, quantities)

	price.aggregate([
		{
			$match: {product_id: {$in: products}}
		},
		{
			$group: {
				_id: "$tailor_id",
				prices: {
					$push: {id: "$_id", product: "$product_id", price: "$amount"}
				},
				products: {
					$push: "$product_id"
				}
				// total: {
				// 	$sum: "$amount"
				// }
			}
		},
		{
			$match: {"products": {$all: products}}
		},
		{
			$lookup: {
				from: "tailors",
				localField: "_id",
				foreignField: "_id",
				as: "tailor"
			}
		},
		{
			$project: {
				_id: 0,
				tailor: {
					id: "$_id",
					name: {$arrayElemAt: ["$tailor.name", 0]},
					max_days: {$arrayElemAt: ["$tailor.max_days_to_complete", 0]}
				},
				prices: 1,
				// total: 1
			}
		}
	])
	.then((resolve) => {


		for(let element of resolve) {

			element.tailor[0].name = element.tailor[0].name.split("(")[0]

			element.total = 0;

			element.prices = element.prices.map(el =>
			{

				element.total += el.price * quantities[products.indexOf(el.product)];

				return {
					id: el.id,
					productId: el.product,
					productName: productNames[products.indexOf(el.product)],
					price: el.price,
					quantity: quantities[products.indexOf(el.product)]
				}

			})

		}

		console.log("Products:", cartData.map(el => new Object({id: el.productId, name: el.productName, quantity: el.quantity})))
		console.log(JSON.stringify(resolve))

		res.status(200).json({
			result: resolve
		})

	})
	.catch((err) => {

		console.log(err)
		res.status(500).json({
			error_msg: "Internal Server Error"
		})

	})

})


router.post('/delievery_boy/create', (req, res) => {

	var new_worker = new delievery_boy({
		name: req.body.name,
		contact: {
			phone_no: req.body.phone_no,
			address: {
				loc: {
					coordinates: [req.body.coordinates.longitude, req.body.coordinates.latitude]
				},
				text: req.body.address_text
			},
			email: req.body.email
		}
	})

	let saved = new_worker.save()
	saved
	.then((result) => {
		console.log("Result:", result)
		res.json({
			status: 201,
			result: result
		})
	})
	.catch((err) => {
		console.log("Error:", err)
		res.status(500).json({
			error_msg: "Internal server error"
		})
	})

})


router.post('/pickup_boy/create', (req, res) => {

	var new_worker = new pickup_boy({
		name: req.body.name,
		contact: {
			phone_no: req.body.phone_no,
			address: {
				loc: {
					coordinates: [req.body.coordinates.longitude, req.body.coordinates.latitude]
				},
				text: req.body.address_text
			},
			email: req.body.email
		}
	})

	let saved = new_worker.save()
	saved
	.then((result) => {
		console.log("Result:", result)
		res.json({
			status: 201,
			result: result
		})
	})
	.catch((err) => {
		console.log("Error:", err)
		res.status(500).json({
			error_msg: "Internal server error"
		})
	})

})




module.exports = router
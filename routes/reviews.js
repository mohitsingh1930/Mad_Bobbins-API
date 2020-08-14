var express = require("express")
var router = express.Router()
var mongoose = require("mongoose")

var handler = require("../errorHandlers")
var review = require("../models/reviews")
const { order } = require("../models/orders")


router.post("/", (req, res) => {

	let {orderId, stars, msg} = req.body

	order.find({order_id: orderId}, {order_id: 1, tailor_id: 1, user_id: 1})
	.then(resolve => {

		if(resolve.length === 0) {

			res.status(400).json({
				error_msg: "OrderId Not Found"
			})

			throw 'OrderId not found'

		}

		let reviewsList = resolve.map(el => new Object({message: msg, rating: stars, order_instance_id: el._id, tailor_id: el.tailor_id, user_id: el.user_id}))

		return review.insertMany(reviewsList)

	})
	.then(resolve => {

		console.log(resolve)

		res.status(201).json({
			msg: "Review Added"
		})

	})
	.catch(err => {

		if(typeof err != "string") {
			res.status(500).json(handler.internalServerError)
		}

	})

})




module.exports = router
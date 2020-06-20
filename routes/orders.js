var express = require("express")
var router = express.Router()
var mongoose = require("mongoose")
var random = require("crypto-random-string")
var dateFns = require("date-fns")

var order = require("../models/orders").order
var products = require("../models/products").product
var user = require("../models/users").user
var tailor = require("../models/tailors")
var price = require("../models/prices")
var temp_user = require("../models/temp_users")

var handler = require("../errorHandlers")


// mongoose.connect("mongodb://localhost/ARLORS", {useNewUrlParser: true})


// multer
const multer = require("multer")
const { product } = require("../models/products")
const upload = multer(
	{
		storage: multer.diskStorage({
			destination: function(req, file, cb) {
				cb(null, __dirname+"/../formUploads/orderProducts")
			},
			filename: function(req, file, cb) {
				let randomString = random({length: 15})
				cb(null, randomString +"."+ file.mimetype)
			}
		})
	}
)


// scope: tailor

router.get("/tailor/status/", (req, res) => {

	if(["pending", "picked", "assigned", "completed", "out", "delievered"].includes(req.body.status)) {

		let query = {
			"tailor_id": req.body.id,
			"status": req.body.status,
			"active.status": 1
		}

		order.aggregate([
			{$match: query},
			{$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: products_name
			}},
			{$project: {
				"order_id": 1,
				"product": {
					"id": 1,
					"type": 1,
					"name": {$arrayElemAt: ["products.name", 0]}
				},
				"status": 1,
				"movements.picked.date": 1,
				"payment.discounted_price": 1,
				"payment.actual_price": 1
			}}
		]).exec()
		.then((result)=> {
			console.log("search result:", result);
			res.json({
				status: 200,
				result: result
			});
		})
		.catch((err)=> {
			res.json({
				status: 500,
				error_msg: "Error in parsing query"
			})
		});

	} else {
		return res.json({
			status: 400,
			error_msg: "INVALID STATUS"
		})
	}

})


router.get("/tailor/pendingDetails", (req, res) => {

	let {tailorId} = req.query;

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"status": "assigned",
				"tailor_id": mongoose.Types.ObjectId(tailorId)
				// "order_id": "$order_id",
				// $or: [ {"status": "pending"}, {$and: [ {"status": "picked"}, {"movements.picked.checked": false}, {"pickup_id": req.query.id} ]} ],
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"temp_id": "$temp_id",
					"status": "$status",
					"dates": "$dates",
					"assigned": "$movements.assigned"
				},
				product: {
					$push: {
						id: "$product.id",
						orderInstanceId: "$_id"
					}
				}
			}
		},
		{
			$lookup: {
				from: "temporary_users",
				foreignField: "_id",
				localField: "_id.temp_id",
				as: "temp_user"
			}
		},
		{
			$unwind: "$product"
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "products"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$_id.order_id",
					"dates": "$_id.dates",
					"status": "$_id.status",
					"temp_user": {$arrayElemAt: ["$temp_user", 0]},
					"assigned": "$_id.assigned"
				},
				"products": {
					$push: {
						"id": "$product.id",
						"name": {$arrayElemAt: ["$products.name", 0]},
						"orderInstanceId": "$product.orderInstanceId"
					}
				}
			}
		},
		{
			$sort: {"_id.dates.pickup": -1}
		}
	]).exec()
	.then((resolve) => {

		// console.log("Result:", resolve);

		resolve = resolve.map(order => new Object({
			orderId: order._id.order_id,
			arrivalDate: dateFns.format(new Date(order._id.assigned.date), "dd-MM-yyyy"),
			status: order._id.status,
			// user: {
			userId: order._id.temp_user._id,
			userName: order._id.temp_user.name,
			// userAge: order._id.temp_user.age,
			// userPhone_no: order._id.temp_user.contact.phone_no,
			// },
			products: order.products
		}))

		console.log("Result:", resolve)

		res.status(200).json({
			result: resolve
		})

	})
	.catch((err) => {

		console.log("Error:", err);
		if(typeof err !== "string")
			res.status(500).json(handler.internalServerError)

	})

})


// response: orderId, pickupDate, tailor: [name, address, phone_no]
router.get("/pickup/picked", (req, res) => {

	let pickupId = req.query.pickupId;

	if(!pickupId) {
		res.status(406).json({
			error_msg: "pickupId is missing"
		})
	}

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"pickup_id": mongoose.Types.ObjectId(pickupId),
				"status": "picked"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"tailor_id": "$tailor_id",
					"status": "$status",
					"dates": "$dates"
				}
			}
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		// {
		// 	$group: {
		// 		_id: {
		// 			"order_id": "$_id.order_id",
		// 			"dates": "$_id.dates",
		// 			"status": "$_id.status",
		// 			"tailor": {$arrayElemAt: ["$tailor", 0]}
		// 		}
		// 	}
		// },
		{
			$sort: {"_id.dates.pickup": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el._id.order_id,
				// pickupDate: dateFns.format(new Date(el._id.dates.pickup), "dd-MM-yyyy"),
				// tailor: {
				tailorName: el.tailor[0].name,
				tailorAddress: el.tailor[0].contact.address.text,
				tailorPhone_no: el.tailor[0].contact.phone_no
				// }
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


// response: orderId, pickupDate, tailor: [name, address, phone_no], deliveryDate
router.get("/pickup/assigned" ,(req, res) => {

	let pickupId = req.query.pickupId;

	if(!pickupId) {
		res.status(406).json({
			error_msg: "pickupId is missing"
		})
	}

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"pickup_id": mongoose.Types.ObjectId(pickupId),
				"status": "assigned"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"tailor_id": "$tailor_id",
					"temp_id": "$temp_id",
					"status": "$status",
					"dates": "$dates"
				}
			}
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		{
			$lookup: {
				from: "temporary_users",
				foreignField: "_id",
				localField: "_id.temp_id",
				as: "temp_user"
			}
		},
		// {
		// 	$group: {
		// 		_id: {
		// 			"order_id": "$_id.order_id",
		// 			"dates": "$_id.dates",
		// 			"status": "$_id.status",
		// 			"tailor": {$arrayElemAt: ["$tailor", 0]},
		// 			"temp_user": {$arrayElemAt: ["$temp_user", 0]}
		// 		}
		// 	}
		// },
		{
			$sort: {"_id.dates.delivery": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el._id.order_id,
				// pickupDate: dateFns.format(new Date(el.dates.pickup), "dd-MM-yyyy"),
				deliveryDate: dateFns.format(dateFns.addDays(new Date(el._id.dates.pickup), el.tailor[0].max_days_to_complete), "dd-MM-yyyy"),
				// tailor: {
				tailorName: el.tailor[0].name,
				customerName: el.temp_user[0].name
				// }
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


router.put("/tailor/update/completed", (req, res) => {

	console.log(req.body)

	order.updateMany(

		// TODO: Save this for future update, pickup_id already assgined in /taken route
		// {
		// 	"active.status": 1,
		// 	"order_id": req.query.order_id,
		// 	"status": "picked",
		// 	"movements.picked.checked": false
		// },
		// {
		// 	$set: {"movements.picked.date": Date.now(), "movements.picked.checked": true}
		// }

		{
			"active.status": 1,
			"order_id": req.body.orderId,
		},
		{
			$set: {status: "picked", "pickup_id": mongoose.Types.ObjectId(req.body.pickupId), "movements.picked.date": new Date(), "movements.picked.checked": true}
		},
		function(err, result) {

			if(err) {

				console.log("ERROR:::\n", err)
				res.status(500).json(handler.internalServerError)

			}
			else {

				console.log("Result>>\n", result)

				if(!result.n) {
					return res.status(404).json({
						error_msg: "Not Found"
					})
				}

				res.status(200).json({
					result: result
				})

			}

	})

})


router.put("/pickup/update/delievered", (req, res) => {

	console.log(req.body.pickupId, req.body.orderId)

	order.update(
		{
			status: "picked",
			order_id: req.body.orderId,
			pickup_id: req.body.pickupId,
			"movements.picked.checked": true
		},
		{
			$set: {"status": "assigned", "movements.assigned": {"date": new Date(), "checked": true}}
		},
		function (err, result) {

			if(err) {
				console.log("ERROR:::\n", err)
				res.status(500).json(handler.internalServerError)
			}
			else {

				console.log("Result>>\n", result)

				if(!result.n) {
					return res.status(404).json({
						error_msg: "Not Found"
					})
				}

				res.status(200).json({
					result: result
				})
			}

		}
	)

})






// <<<<<<<<<<<<<<<<<<<<<<<<<<<<SCOPE: pickup

router.get("/pickup/measurements", (req, res) => {

	let {userId: tempUserId, productId} = req.query;

	Promise.all([

		// measurement of last data of that user
		order.find({"temp_id": tempUserId, "product.id": productId})
		.sort({"dates.order": -1})
		.limit(1)
		.exec(),

		// find coverage property of the product
		product.find({_id: productId}, {coverage: 1})
		.exec()

	])
	.then((resolve) => {

		let coverage = resolve[1][0].coverage;
		resolve = resolve[0][0].measurements;
		console.log("Resolve:", resolve)
		console.log("Coverage:", coverage)


		delete resolve.$init
		delete resolve.top.$init
		delete resolve.bottom.$init
		delete resolve.blouse.$init

		let result = []

		for(let key of Object.keys(resolve)) {

			if(coverage.includes(key)) {
				result.push({
					[key]: Object.keys(resolve[key]).map(el => new Object({name: el, value: String(resolve[key][el] || 0)}))
				})
			}
			else {
				result.push({
					[key]: []
				})
			}

		}

		res.status(200).json({
			result: result
		})

	})
	.catch((err) => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


router.post("/pickup/measurements", (req, res) => {

	let {id, top, bottom, blouse} = req.body;

	if(!id)
		return res.status(406).json({
			error_msg: "orderInstanceId not provided"
		})

	console.log(top,"\n", bottom,"\n", blouse)

	let measurements = {

		top: top.length?JSON.parse(top):[],
		bottom: bottom.length?JSON.parse(bottom):[],
		blouse: blouse.length?JSON.parse(blouse):[],

	};

	let result = {
		top: top?{}:undefined,
		bottom: bottom?{}:undefined,
		blouse: blouse?{}:undefined
	}

	for(let key of Object.keys(measurements)) {

		for(let obj of measurements[key]) {
			result[key][obj.name] = Number(obj.value)
		}

	}

	console.log("Measurements:", result)

	// return res.status(500).json({
	// 	error_msg: "Halt"
	// })
	// for(let element in measurements)
	// 	obj[element.name] = element.value

	order.updateOne(
		{
			_id: mongoose.Types.ObjectId(id)
		},
		{
			"measurements": result
		}
	).exec()
	.then((resolve) => {

		console.log(resolve)
		res.status(200).json({
			msg: "Measurements Updated"
		})

	})
	.catch((err) => {

		res.status(500).json(handler.internalServerError)

	})


})



router.get("/pickup/pending", (req, res) => {

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				$or: [ {"status": "pending"}, {$and: [ {"status": "picked"}, {"movements.picked.checked": false}, {"pickup_id": req.query.id} ]} ],
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"temp_id": "$temp_id",
					"status": "$status",
					"dates": "$dates"
				}
			}
		},
		{
			$lookup: {
				from: "temporary_users",
				foreignField: "_id",
				localField: "_id.temp_id",
				as: "temp_user"
			}
		},
		{
			$project: {
				"dates": 1,
				"order_id": "_id.order_id",
				"status": 1,
				"temp_user": {$arrayElemAt: ["$_id.temp_user", 0]}
			}
		}
	]).exec()
	.then((resolve) => {

		console.log("Result:", resolve);

		res.status(200).json({
			result: resolve.map(el => {
				return {
					orderId: el.order_id,
					pickupDate: dateFns.format(new Date(el.dates.pickup), "dd-MM-yyyy"),
					user: {
						name: el.temp_user.name,
						age: el.temp_user.age,
						phone_no: el.temp_user.contact.phone_no,
						address: el.temp_user.contact.address.text
					}
				}
			})
		})

	})
	.catch((err) => {

		console.log("Error:", err);
		res.status(500).json(handler.internalServerError)

	})

})


// response: orderId, status, pickupDate, user: [id, name, address, phone_no, age], products: [id, name, orderInstanceId]
router.get("/pickup/pending/details", (req, res) => {

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"status": "pending"
				// "order_id": "$order_id",
				// $or: [ {"status": "pending"}, {$and: [ {"status": "picked"}, {"movements.picked.checked": false}, {"pickup_id": req.query.id} ]} ],
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"temp_id": "$temp_id",
					"status": "$status",
					"dates": "$dates"
				},
				product: {
					$push: {
						id: "$product.id",
						orderInstanceId: "$_id"
					}
				}
			}
		},
		{
			$lookup: {
				from: "temporary_users",
				foreignField: "_id",
				localField: "_id.temp_id",
				as: "temp_user"
			}
		},
		{
			$unwind: "$product"
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "products"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$_id.order_id",
					"dates": "$_id.dates",
					"status": "$_id.status",
					"temp_user": {$arrayElemAt: ["$temp_user", 0]}
				},
				"products": {
					$push: {
						"id": "$product.id",
						"name": {$arrayElemAt: ["$products.name", 0]},
						"orderInstanceId": "$product.orderInstanceId"
					}
				}
			}
		},
		{
			$sort: {"_id.dates.pickup": -1}
		}
	]).exec()
	.then((resolve) => {

		// console.log("Result:", resolve);

		resolve = resolve.map(order => new Object({
			orderId: order._id.order_id,
			pickupDate: dateFns.format(new Date(order._id.dates.pickup), "dd-MM-yyyy"),
			status: order._id.status,
			user: {
				id: order._id.temp_user._id,
				name: order._id.temp_user.name,
				age: order._id.temp_user.age,
				addresss: order._id.temp_user.contact.address.text,
				phone_no: order._id.temp_user.contact.phone_no
			},
			products: order.products
		}))

		console.log("Result:", resolve)

		res.status(200).json({
			result: resolve
		})

	})
	.catch((err) => {

		console.log("Error:", err);
		if(typeof err !== "string")
			res.status(500).json(handler.internalServerError)

	})

})


// response: orderId, pickupDate, tailor: [name, address, phone_no]
router.get("/pickup/picked", (req, res) => {

	let pickupId = req.query.pickupId;

	if(!pickupId) {
		res.status(406).json({
			error_msg: "pickupId is missing"
		})
	}

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"pickup_id": mongoose.Types.ObjectId(pickupId),
				"status": "picked"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"tailor_id": "$tailor_id",
					"status": "$status",
					"dates": "$dates"
				}
			}
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		// {
		// 	$group: {
		// 		_id: {
		// 			"order_id": "$_id.order_id",
		// 			"dates": "$_id.dates",
		// 			"status": "$_id.status",
		// 			"tailor": {$arrayElemAt: ["$tailor", 0]}
		// 		}
		// 	}
		// },
		{
			$sort: {"_id.dates.pickup": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el._id.order_id,
				// pickupDate: dateFns.format(new Date(el._id.dates.pickup), "dd-MM-yyyy"),
				// tailor: {
				tailorName: el.tailor[0].name,
				tailorAddress: el.tailor[0].contact.address.text,
				tailorPhone_no: el.tailor[0].contact.phone_no
				// }
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


// response: orderId, pickupDate, tailor: [name, address, phone_no], deliveryDate
router.get("/pickup/assigned" ,(req, res) => {

	let pickupId = req.query.pickupId;

	if(!pickupId) {
		res.status(406).json({
			error_msg: "pickupId is missing"
		})
	}

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"pickup_id": mongoose.Types.ObjectId(pickupId),
				"status": "assigned"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"tailor_id": "$tailor_id",
					"temp_id": "$temp_id",
					"status": "$status",
					"dates": "$dates"
				}
			}
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		{
			$lookup: {
				from: "temporary_users",
				foreignField: "_id",
				localField: "_id.temp_id",
				as: "temp_user"
			}
		},
		// {
		// 	$group: {
		// 		_id: {
		// 			"order_id": "$_id.order_id",
		// 			"dates": "$_id.dates",
		// 			"status": "$_id.status",
		// 			"tailor": {$arrayElemAt: ["$tailor", 0]},
		// 			"temp_user": {$arrayElemAt: ["$temp_user", 0]}
		// 		}
		// 	}
		// },
		{
			$sort: {"_id.dates.delivery": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el._id.order_id,
				// pickupDate: dateFns.format(new Date(el.dates.pickup), "dd-MM-yyyy"),
				deliveryDate: dateFns.format(dateFns.addDays(new Date(el._id.dates.pickup), el.tailor[0].max_days_to_complete), "dd-MM-yyyy"),
				// tailor: {
				tailorName: el.tailor[0].name,
				customerName: el.temp_user[0].name
				// }
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


// NOT_IN_USE:
router.get("/pickup/findById", (req, res) => {

	order.aggregate([
		{
			$match: {
				"pickup_id": req.query.pickup_id,
				"_id": req.params.id
			}
		},
		{
			$lookup: {
				from: "users",
				let: { user_id: "$user_id", addresss_id: "$address_id" },
				pipeline: [
					{
						$match: {_id: "$$user_id"}
					},
					{
						$unwind: "$contact.address"
					},
					{
						$match: {"contact.address._id": "$$address_id"}
					}
				],
				as: "users"
			}
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "products"
			}
		},
		{
			$project: {
				"dates": 1,
				"movements": 1,
				"order_id": 1,
				"user.id": "$user_id",
				"status": 1,
				"active": 1,
				"product": {
					"type": 1,
					"id": 1,
					"name": {$arrayElemAt: ["$products.name", 0]}
				},
				"user.name": {$arrayElemAt: ["$users.name", 0]},
				"user.address": {$arrayElemAt: ["$user.address", 0]},
				"temp_user": 1
			}
		}
	])

})


router.post("/pickup/productImage", upload.single(), (req, res) => {

	order.update(
		{
			"order_id": req.body.order_id,
			"_id": req.body.id
		},
		{
			$set: {"product.image": randomString +"."+ req.file.filename}
		}
	).exec()
	.then((resolve, reject) => {

		console.log(resolve)
		res.json({
			status: 201,
			result: resolve
		})

	})
	.catch((err) => {
		res.json(handler.internalServerError)
	})

})


// NOT_IN_USE:
router.put("/pickup/update/taken", (req, res) => {

	order.update(
		{
			"active.status": 1,
			"order_id": req.query.order_id,
			"status": "pending"
		},
		{
			$set: {status: "picked", pickup_id: req.query.id}
		},
		function(err, result) {

			if(err) {
				console.log("ERROR:::\n", err)
				res.json(handler.internalServerError)
			}
			else {
				console.log("Result>>\n", result)
				res.json({
					status: 200,
					result: result
				})
			}
		}
	)

})


router.put("/pickup/update/picked", (req, res) => {

	console.log(req.body)

	order.updateMany(

		// TODO: Save this for future update, pickup_id already assgined in /taken route
		// {
		// 	"active.status": 1,
		// 	"order_id": req.query.order_id,
		// 	"status": "picked",
		// 	"movements.picked.checked": false
		// },
		// {
		// 	$set: {"movements.picked.date": Date.now(), "movements.picked.checked": true}
		// }

		{
			"active.status": 1,
			"order_id": req.body.orderId,
		},
		{
			$set: {status: "picked", "pickup_id": mongoose.Types.ObjectId(req.body.pickupId), "movements.picked.date": new Date(), "movements.picked.checked": true}
		},
		function(err, result) {

			if(err) {

				console.log("ERROR:::\n", err)
				res.status(500).json(handler.internalServerError)

			}
			else {

				console.log("Result>>\n", result)

				if(!result.n) {
					return res.status(404).json({
						error_msg: "Not Found"
					})
				}

				res.status(200).json({
					result: result
				})

			}

	})

})


router.put("/pickup/update/delievered", (req, res) => {

	console.log(req.body.pickupId, req.body.orderId)

	order.update(
		{
			status: "picked",
			order_id: req.body.orderId,
			pickup_id: req.body.pickupId,
			"movements.picked.checked": true
		},
		{
			$set: {"status": "assigned", "movements.assigned": {"date": new Date(), "checked": true}}
		},
		function (err, result) {

			if(err) {
				console.log("ERROR:::\n", err)
				res.status(500).json(handler.internalServerError)
			}
			else {

				console.log("Result>>\n", result)

				if(!result.n) {
					return res.status(404).json({
						error_msg: "Not Found"
					})
				}

				res.status(200).json({
					result: result
				})
			}

		}
	)

})





// <<<<<<<<<<<<<<<<<<<<<<<<<<<<SCOPE: delivery

router.get("/delievery/pending", (req, res) => {

	// if(!status[req.params.status]) {
	// 	res.send({
	// 		status: 400,
	// 		error_msg: "Not a valid status"
	// 	})
	// }

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				$or: [{status: "completed"}, {$and: [{status: "out"}, {"movements.out.checked": false}, {"deliever_id": req.query.deliever_id} ]} ],
			}
		},
		{
			$lookup: {
				from: "users",
				let: { user_id: "$user_id", addresss_id: "$address_id" },
				pipeline: [
					{
						$match: {_id: "$$user_id"}
					},
					{
						$unwind: "$contact.address"
					},
					{
						$match: {"contact.address._id": "$$address_id"}
					}
				],
				as: "users"
			}
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "products"
			}
		},
		{
			$project: {
				"dates": 1,
				"user.id": "$user_id",
				"status": 1,
				"product": {
					"type": 1,
					"id": 1,
					"name": {$arrayElemAt: ["$products.name", 0]}
				},
				"user.name": {$arrayElemAt: ["$users.name", 0]},
				"user.contact_num": {$arrayElemAt: ["$user.contact.phone_no", 0]},
				"user.address": {$arrayElemAt: ["$user.address", 0]},
				"temp_user": 1
			}
		}
	]).exec()
	.then((result) => {
		console.log("Result:", result);
		res.json({
			status: 200,
			result: result
		})
	})
	.catch((err) => {
		console.log("Error:", err);
		res.json({
			status: 500,
			error_msg: "Something wrong"
		})
	})

})


router.get("/delievery/picked", (req, res) => {

	// if(!status[req.params.status]) {
	// 	res.send({
	// 		status: 400,
	// 		error_msg: "Not a valid status"
	// 	})
	// }

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"status": "out",
				"deliever_id": req.query.id,
				"movements.out.checked": true
			}
		},
		{
			$lookup: {
				from: "users",
				let: { user_id: "$user_id", addresss_id: "$address_id" },
				pipeline: [
					{
						$match: {_id: "$$user_id"}
					},
					{
						$unwind: "$contact.address"
					},
					{
						$match: {"contact.address._id": "$$address_id"}
					}
				],
				as: "users"
			}
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "products"
			}
		},
		{
			$project: {
				"dates": 1,
				"user.id": "$user_id",
				"status": 1,
				"product": {
					"type": 1,
					"id": 1,
					"name": {$arrayElemAt: ["$products.name", 0]}
				},
				"user.name": {$arrayElemAt: ["$users.name", 0]},
				"user.contact_num": {$arrayElemAt: ["$user.contact.phone_no", 0]},
				"user.address": {$arrayElemAt: ["$user.address", 0]},
				"temp_user": 1
			}
		}
	]).exec()
	.then((result) => {
		console.log("Result:", result);
		res.json({
			status: 200,
			result: result
		})
	})
	.catch((err) => {
		console.log("Error:", err);
		res.json({
			status: 500,
			error_msg: "Something wrong"
		})
	})

})


router.get("/delievery/delievered", (req, res) => {

	// if(!status[req.params.status]) {
	// 	res.send({
	// 		status: 400,
	// 		error_msg: "Not a valid status"
	// 	})
	// }

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"status": "delievered",
				"deliever_id": req.query.id,
				"movements.delievered.checked": true
			}
		},
		{
			$lookup: {
				from: "users",
				let: { user_id: "$user_id", addresss_id: "$address_id" },
				pipeline: [
					{
						$match: {_id: "$$user_id"}
					},
					{
						$unwind: "$contact.address"
					},
					{
						$match: {"contact.address._id": "$$address_id"}
					}
				],
				as: "users"
			}
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "products"
			}
		},
		{
			$project: {
				"dates": 1,
				"user.id": "$user_id",
				"status": 1,
				"product": {
					"type": 1,
					"id": 1,
					"name": {$arrayElemAt: ["$products.name", 0]}
				},
				"user.name": {$arrayElemAt: ["$users.name", 0]},
				"user.contact_num": {$arrayElemAt: ["$user.contact.phone_no", 0]},
				"user.address": {$arrayElemAt: ["$user.address", 0]},
				"temp_user": 1
			}
		}
	]).exec()
	.then((result) => {
		console.log("Result:", result);
		res.json({
			status: 200,
			result: result
		})
	})
	.catch((err) => {
		console.log("Error:", err);
		res.json({
			status: 500,
			error_msg: "Something wrong"
		})
	})

})


router.put("/delievery/update/taken", (req, res) => {

	order.update(
		{
			"active.status": 1,
			"order_id": req.query.order_id,
			"status": "completed"
		},
		{
			$set: {status: "out", deliever_id: req.query.id}
		},
		function(err, result) {

			if(err) {
				console.log("ERROR:::\n", err)
				res.json(handler.internalServerError)
			}
			else {
				console.log("Result>>\n", result)
				res.json({
					status: 200,
					result: result
				})
			}

		}
	)

})


router.put("/delievery/update/picked", (req, res) => {

	order.update(
		{
			"active.status": 1,
			"order_id": req.query.order_id,
			"status": "out",
			"movements.out.checked": false
		},
		{
			$set: {"movements.out.date": Date.now(), "movements.out.checked": true}
		}
	),
	function(err, result) {

		if(err) {
			console.log("ERROR:::\n", err)
			res.json(handler.internalServerError)
		}
		else {
			console.log("Result>>\n", result)
			res.json({
				status: 200,
				result: result
			})
		}

	}

})


router.put("/delievery/update/delievered", (req, res) => {

	order.update(
		{
			status: "out",
			order_id: req.query.order_id,
			pickup_id: req.query.pickup_id,
			"movements.out.checked": true
		},
		{
			$set: {"status": "delievered", "movements.delievered": {"date": Date.now(), "checked": true}}
		},
		function (err, result) {

			if(err) {
				console.log("ERROR:::\n", err)
				res.json(handler.internalServerError)
			}
			else {
				console.log("Result>>\n", result)
				res.json({
					status: 200,
					result: result
				})
			}

		}
	)

})




// scope: customer

router.post("/customer/create", async (req, res) => {

	//TODO: validate all neccesary information

	let orders_details = req.body;


	orders_details.products = JSON.parse(orders_details.products)
	orders_details.tempUser = JSON.parse(orders_details.tempUser)

	console.log("Body:", orders_details, orders_details.products.map(el => el.id))

	let promise2 = {};
	if(!orders_details.tempUser.id) {

		promise2 = temp_user.create({
			name: orders_details.tempUser.name,
			age: Number(orders_details.tempUser.age),
			contact: {
				phone_no: orders_details.tempUser.phone_no,
				address: {
					text: orders_details.tempUser.address
				}
			}
		})

	}
	else {

		promise2._id = orders_details.tempUser.id

	}

	Promise.all([
		price.find({"_id": {$in: orders_details.products.map(el => el.id)}}, {amount: 1}).exec(),
		promise2
	])
	.then(async (values) => {

		products = values[0]

		console.log(products)

		// generate order id
		let order_id = dateFns.format(new Date(), "yyyyMMdd");

		let lastOrderOfDay = await order.find(
			{
				$expr: {
					$eq: [ {$dayOfYear: "$dates.order"}, {$dayOfYear: new Date()} ]
				}
			},
			{
				"order_id": 1
			}
		)
		.sort({"order_id": -1})
		.limit(1)
		.exec()

		if(lastOrderOfDay.length == 0)
			order_id += 1
		else
			order_id += Number(lastOrderOfDay[0].order_id.slice(8)) + 1;


		//generating docs
		let docs = [];

		for(let product of orders_details.products) {

			for(let i=0; i<Number(product.quantity); i++) {

				docs.push({
					order_id: order_id,
					product: {type: 'basic', id: Number(product.productId)},
					user_id: orders_details.userId,
					tailor_id: orders_details.tailorId,
					"dates.pickup": handler.toDate(orders_details.pickupDate),
					// addresss_id: product.addresss_id,
					arrangement_id: orders_details.pickupSlotId,		//schedule id
					payment: {
						price_id: product.id,
						current_price: products.find(el => String(el._id)==product.id).amount,
						prepaid: false
					},
					temp_id: new mongoose.Types.ObjectId(String(values[1]._id))
				})

			}

		}


		return order.insertMany(docs)


	})
	.then(result => {

		console.log(result)
		res.status(201).json({
			msg: "order successfully created"
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})


})


router.get("/customer", async (req, res) => {

	let userId = req.query.userId;

	console.log(userId)

	order.aggregate([
		{
			$match: {"user_id": mongoose.Types.ObjectId(userId)}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"dates": {
						"pickup": "$dates.pickup",
						"order": "$dates.order"
					},
					"arrangement_id": "$arrangement_id",
					"tailor_id": "$tailor_id",
					"status": "$status",
					"movements": "$movements"
					// "daysToComplete": {$arrayElemAt: ["$tailor.daysToComplete", 0]},
					// "arrangement": {$filter: ["$schedules"]}
				}
			}
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		{
			$lookup: {
				from: "schedules",
				let: {arrangement_id: "$_id.arrangement_id", pickup_date: "$_id.dates.pickup"},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [{$dayOfYear: "$date"}, {$dayOfYear: "$$pickup_date"}]
							}
						},
					},
					{
						$project: {arrangements: "$arrangements"}
					}
				],
				as: "schedules"
			}
		},
		{
			$project: {
				order_id: "$_id.order_id",
				dates: "$_id.dates",
				status: "$_id.status",
				movements: "$_id.movements",
				daysToComplete: {$arrayElemAt: ["$tailor.max_days_to_complete", 0]},
				slot: {$arrayElemAt: [{$filter: {input: {$arrayElemAt: ["$schedules.arrangements", 0]}, as: "element", cond: {$eq: ["$$element._id", "$_id.arrangement_id"]}} }, 0] }
			}
		},
		{
			$sort: {"dates.order": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)
		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el.order_id,
				pickupDate: dateFns.format(new Date(el.dates.pickup), "dd MMM"),
				status: handler.computeOrderStatus(el.status, el.movements),
				slot: handler.slotsToString(el.slot).string,
				deliveryDate: dateFns.format(dateFns.addDays(new Date(el.dates.pickup), el.daysToComplete), "EEE, dd MMM")
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})


})


router.get("/customer/detail", (req, res) => {

	let userId = req.query.userId;
	let orderId = req.query.orderId;


	order.aggregate([
		{
			$match: {
				"user_id": mongoose.Types.ObjectId(userId),
				"order_id": orderId
			},
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"product": "$product",
					"dates": {
						"pickup": "$dates.pickup",
						"order": "$dates.order"
					},
					"arrangement_id": "$arrangement_id",
					"tailor_id": "$tailor_id",
					"status": "$status",
					"movements": "$movements",
					"payment": "$payment",
					"temp_id": "$temp_id"
					// "daysToComplete": {$arrayElemAt: ["$tailor.daysToComplete", 0]},
					// "arrangement": {$filter: ["$schedules"]}
				},
				"quantity": {$sum: 1}
			}
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		{
			$lookup: {
				from: "schedules",
				let: {arrangement_id: "$_id.arrangement_id", pickup_date: "$_id.dates.pickup"},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [{$dayOfYear: "$date"}, {$dayOfYear: "$$pickup_date"}]
							}
						},
					},
					{
						$project: {arrangements: "$arrangements"}
					}
				],
				as: "schedules"
			}
		},
		{
			$lookup: {
				from: "temporary_users",
				foreignField: "_id",
				localField: "_id.temp_id",
				as: "temp_user"
			}
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "_id.product.id",
				as: "productDetails"
			}
		},
		{
			$project: {
				product: {
					id: {$arrayElemAt: ["$productDetails._id", 0]},
					name: {$arrayElemAt: ["$productDetails.name", 0]},
					quantity: "$quantity",
					price: "$_id.payment.current_price",
				},
				temp_user: {$arrayElemAt: ["$temp_user", 0]},
				dates: "$_id.dates",
				status: "$_id.status",
				movements: "$_id.movements",
				daysToComplete: {$arrayElemAt: ["$tailor.max_days_to_complete", 0]},
				slot: {$arrayElemAt: [{$filter: {input: {$arrayElemAt: ["$schedules.arrangements", 0]}, as: "element", cond: {$eq: ["$$element._id", "$_id.arrangement_id"]}} }, 0] }
			}
		},
		{
			$sort: {"dates.order": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		if(resolve.length === 0) {
			res.status(404).json({
				error_msg: "Not Found"
			})
			throw `Not found`
		}
		let temp, total=0;

		temp = {
			orderId: resolve[0].order_id,
			pickupDate: dateFns.format(new Date(resolve[0].dates.pickup), "dd MMM"),
			status: handler.computeOrderStatus(resolve[0].status, resolve[0].movements),
			slot: handler.slotsToString(resolve[0].slot).string,
			deliveryDate: dateFns.format(dateFns.addDays(new Date(resolve[0].dates.pickup), resolve[0].daysToComplete), "EEE, dd MMM"),
			user: {
				name: resolve[0].temp_user.name,
				age: resolve[0].temp_user.age,
				address: resolve[0].temp_user.contact.address.text
			},
			products: resolve.map(el => {
				total += el.product.price*el.product.quantity;
				return new Object({
					id: el.product.id,
					name: el.product.name,
					quantity: el.product.quantity,
					price: el.product.price
				})
			}),
			totalPrice: total,
			deliveryPrice: 0
		}

		res.status(200).json({
			result: temp
		})

	})
	.catch(err => {

		console.log(err)
		if(typeof err !== "string")
			res.status(500).json(handler.internalServerError)

	})

})



router.get("/customer/tempDetails", (req, res) => {

	let query = {};
	query._id = req.query.userId;

	let intermediates = {};

	user.find(query, {wallets: 0, measurements: 0}).exec()
	.then((resolve) => {

		if(resolve.length == 0) {

			res.status(404).json({
				error_msg: "User Not Found"
			})
			throw `User Doesn't Exist`;

		}

		intermediates.phone_no = resolve[0].contact.phone_no

		let query = {user_id: new mongoose.Types.ObjectId(req.query.userId), "active.status": {$ne: "cancelled"}};
		return order.aggregate([
			{
				$match: query
			},
			{
				$group: {
					_id: "$temp_id"
				}
			},
			{
				$lookup: {
					from: "temporary_users",
					foreignField: "_id",
					localField: "_id",
					as: "details"
				}
			},
			{
				$project: {
					id: "$_id",
					name: {$arrayElemAt: ["$details.name", 0]},
					age: {$arrayElemAt: ["$details.age", 0]},
					phone_no: {$arrayElemAt: ["$details.contact.phone_no", 0]},
					address: {$arrayElemAt: ["$details.contact.address.text", 0]}
				}
			}
		])
		.sort({"dates.order": -1})

	})
	.then((resolve) => {

		console.log(resolve)

		res.status(200).json({
			result: {
				phoneNumber: intermediates.phone_no,
				details: resolve
				// details: resolve.map(el => new Object({name: el.temp_user.name, age: el.temp_user.age, phone_no: el.temp_user.contact.phone_no, address: el.temp_user.contact.address.text}))
			}
		})

	})
	.catch((err) => {

		console.log("Error:", err);

		if(typeof err != 'string' )
			res.status(500).json(handler.internalServerError)

	})

})


router.put("/customer/tempDetails", (req, res) => {

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



router.get("/customer/findById/", (req, res) => {

	let query = {
		"user_id": req.body.id,
		"order_id": req.body.id
	}

	order.aggregate([
		{$match: query},
		{$lookup: {
			from: "products",
			foreignField: "_id",
			localField: "product.id",
			as: products_name
		}},
		{$project: {
			"order_id": 1,
			"product": {
				"id": 1,
				"type": 1,
				"name": {$arrayElemAt: ["products.name", 0]}
			},
			"status": 1,
			"movements": 1,
			"payment": 1,
			"active": 1
		}}
	]).exec()
	.then((result)=> {
		console.log("search result:", result);
		res.json({
			status: 200,
			result: result
		});
	})
	.catch((err)=> {
		res.json({
			status: 500,
			error_msg: "Error in parsing query"
		})
	});

})


router.delete("/delete", (req, res) => {

	var id = req.params.id;

	order.deleteOne(
		{
			_id: id
		},
		function (err, result) {
			if(err) {
				console.log("Error:", err)
			} else {
				console.log("Delete result:", result)
			}
		}
	)

})



module.exports = router
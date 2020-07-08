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
// const multer = require("multer")
// const { product } = require("../models/products")
// const { resolveSoa } = require("dns")
// const upload = multer(
// 	{
// 		storage: multer.diskStorage({
// 			destination: function(req, file, cb) {
// 				cb(null, __dirname+"/../formUploads/orderProducts")
// 			},
// 			filename: function(req, file, cb) {
// 				let randomString = random({length: 15})
// 				cb(null, randomString +"."+ file.mimetype)
// 			}
// 		})
// 	}
// )


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
						image: "$product.imageStream",
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
						"orderInstanceId": "$product.orderInstanceId",
						"image": "$product.image"
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

		// console.log("Result:", resolve)

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


router.get("/tailor/productExtras", (req, res) => {

	let id = req.query.id;

	order.aggregate([
		{
			$match: {
				_id: mongoose.Types.ObjectId(id)
			}
		},
		{
			$project: {
				addons: "$extras",
				description: 1
			}
		},
		// {
		// 	$unwind: "$addons"
		// },
		// {
		// 	$lookup: {
		// 		from: "products",
		// 		foreignField: "_id",
		// 		localField: "addons.id",
		// 		as: "product"
		// 	}
		// },
		// {
		// 	$group: {
		// 		_id: {
		// 			_id: "$_id",
		// 			description: "$description"
		// 		},
		// 		addons: {$push: {$arrayElemAt: ["$product.name", 0]}}
		// 	}
		// }
	]).exec()
	.then(resolve => {

		console.log(JSON.stringify(resolve))

		res.status(200).json({
			addons: resolve.map(el => el.addons?el.addons.map(el2 => handler.addons[el2.id]):[] )[0] || [],
			description: resolve.map(el => el.description)[0] || ""
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


router.get("/tailor/productImage", (req, res) => {

	let id = req.query.id;

	order.findById(id).exec()
	.then(resolve => {

		console.log(resolve)
		if(!resolve) {
			res.sendStatus(404)
		}
		else {

			res.status(200).json({
				result: resolve[0].product.imageStream?resolve[0].product.imageStream:""
			})

		}

	})

})


router.get("/tailor/measurements", (req, res) => {

	let id = req.query.id;

	if(!id)
		res.status(406).json({error_msg: "orderInstanceId not given"})

	order.findById(id).select({measurements: 1}).exec()
	.then(resolve => {

		console.log(resolve)
		if(resolve == null) {

			res.status(404).json({
				error_msg: "measurements not found"
			})

		}
		else {

			let result = []
			resolve = resolve.measurements;

			delete resolve.$init
			delete resolve.top.$init
			delete resolve.bottom.$init
			delete resolve.blouse.$init

			for(let key of Object.keys(resolve)) {

				result.push({
					[key]: Object.keys(resolve[key]).map(el => new Object({name: el, value: String(resolve[key][el] || 0)}))
				})

			}
			
			res.status(200).json({result})

		}


	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


// response: orderId, pickupDate, tailor: [name, address, phone_no]
router.get("/tailor/stitched", (req, res) => {

	let tailorId = req.query.tailorId;

	if(!tailorId) {
		return res.status(406).json({
			error_msg: "pickupId is missing"
		})
	}

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"tailor_id": mongoose.Types.ObjectId(tailorId),
				"status": "completed"
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
				userName: el.temp_user[0].name
				// tailorAddress: el.tailor[0].contact.address.text,
				// tailorPhone_no: el.tailor[0].contact.phone_no
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
router.get("/tailor/completed" ,(req, res) => {

	let tailorId = req.query.tailorId;

	if(!tailorId) {
		return res.status(406).json({
			error_msg: "tailorId is missing"
		})
	}

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"tailor_id": mongoose.Types.ObjectId(tailorId),
				"status": {
					$in: ["out", "delivered"]
				}
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
				from: "movers_deliveries",
				foreignField: "_id",
				localField: "_id.deliver_id",
				as: "delivery_client"
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
			$sort: {"_id.dates.order": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el._id.order_id,
				// pickupDate: dateFns.format(new Date(el.dates.pickup), "dd-MM-yyyy"),
				deliveryDate: dateFns.format(dateFns.addDays(new Date(el._id.dates.pickup), el.tailor[0].max_days_to_complete), "dd-MM-yyyy"),
				deliveryClientName: el.delivery_client[0]?el.delivery_client[0].name:"",
				// tailor: {
				// tailorName: el.tailor[0].name,
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


router.put("/tailor/update/stitched", (req, res) => {

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
			"tailor_id": req.body.tailorId,
			"order_id": req.body.orderId,
		},
		{
			$set: {status: "completed"}
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


router.put("/tailor/update/completed", (req, res) => {

	console.log(req.body.tailorId, req.body.orderId)

	order.updateMany(
		{
			status: "completed",
			order_id: req.body.orderId,
			tailor_id: req.body.tailorId,
			"movements.assigned.checked": true
		},
		{
			$set: {"status": "out", "movements.out": {"date": new Date(), "checked": true}}
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

	// measurement of last data of that user
	let lastSavedMeasurement = 	order.find({"temp_id": tempUserId, "product.id": productId, "measurements": {$exists: true}})
	.sort({"dates.order": -1, "order_id": -1})
	.limit(1)
	.exec()

	let coverage = products.find({_id: productId}).select({coverage: 1}).exec()

	Promise.all([
		lastSavedMeasurement,
		coverage
	])
	.then((resolve) => {

		// console.log(resolve[0][0])

		let coverage = resolve[1][0].coverage;
		// console.log("Resolve:", resolve)
		// console.log("Coverage:", coverage)


		if(resolve[0][0]) {

			resolve = resolve[0][0].measurements

			delete resolve.$init
			delete resolve.top.$init
			delete resolve.bottom.$init
			delete resolve.blouse.$init

		}
		else {

			resolve = {
				top: {
					"length": 0,
					"teera": 0,
					"Upper chest": 0,
					"middle chest": 0,
					"lower chest": 0,
					"waist": 0,
					"hip": 0,
					"sleeves length": 0,
					"sleeves botton": 0,
					"front neck": 0,
					"back neck": 0,
					"armole": 0
				},
				bottom: {
					"length": 0,
					"hip": 0,
					"bottom": 0,
					"bottom width": 0,
					"thigh": 0,
					"waist": 0
				},
				blouse: {
					"length": 0,
					"upper chest": 0,
					"middle chest": 0,
					"lower chest": 0,
					"sleeves length": 0,
					"sleeves bottom": 0,
					"waist": 0,
					"across back": 0,
					"armole": 0
				}
			}

		}

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


router.post("/pickup/productDetails", (req, res) => {

	// console.log(req.body)

	let {id, top, bottom, blouse} = req.body;

	let {addons, designPrice, description} = req.body

	// setting up vairables
	let temp = [];
	addons = JSON.parse(addons)
	for(let item of addons) {
		if(item.value)
			temp.push(Number(item.id))
	}
	addons = temp;


	if(!id || !addons)
	return res.status(406).json({
		error_msg: "Something is missing"
	})

	designPrice = designPrice == ""?null:Number(designPrice)

	console.log(top, bottom, blouse, addons, designPrice)

	let measurements = {

		top: top.length?JSON.parse(top):[],
		bottom: bottom.length?JSON.parse(bottom):[],
		blouse: blouse.length?JSON.parse(blouse):[],

	};

	let result = {
		top: top.length?{}:undefined,
		bottom: bottom.length?{}:undefined,
		blouse: blouse.length?{}:undefined
	}

	for(let key of Object.keys(measurements)) {

		for(let obj of measurements[key]) {
			result[key][obj.name] = Number(obj.value)
		}

	}


	// if price if given then update
	let designPriceUpdate = designPrice?
	order.updateOne(
		{
			_id: mongoose.Types.ObjectId(id)
		},
		{
			// "measurements": result,
			// "extras": addons,
			"payment.design_price": designPrice,
		}
	).exec()
	:
	Promise.resolve("Design Price not given")

	// get addons price for this tailor
	let addonsPricesFetch = order.aggregate([
		{
			$match:	{_id: mongoose.Types.ObjectId(id)}
		},
		{
			$lookup: {
				from: "prices",
				let: {tailor_id: "$tailor_id"},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$tailor_id", "$$tailor_id"]
							},
							active: true,
							product_id: {$in: addons}
						}
					}
				],
				as: "addon_prices"
			}
		},
		{
			$project: {
				addons_prices: "$addon_prices"
			}
		}
	]).exec()

	Promise.all([designPriceUpdate, addonsPricesFetch])
	.then(resolves => {

		console.log("resolves:", resolves[0])
		console.log(resolves[1])

		resolve = resolves[1]
		// console.log(resolve)

		resolve = resolve[0].addons_prices

		let addonsPrice = 0;

		let addons = resolve.map(el => {
			addonsPrice += el.amount;
			return {
				type: "extra-material",
				id: el.product_id
			}
		})

		// console.log(addons, addonsPrice)

		// return Promise.resolve("Intermediate")

		let updateQuery = {
			"measurements": result,
			"extras": addons,
			"description": description
		}

		if(designPrice) {
			updateQuery["payment.current_price"] = designPrice + addonsPrice
		}
		else {
			updateQuery["$inc"] = {"payment.current_price": addonsPrice}
		}


		return order.updateOne(
			{
				_id: mongoose.Types.ObjectId(id)
			},
			updateQuery
		).exec()

	})
	.then((resolve) => {

		console.log(resolve)
		res.status(200).json({
			msg: "Order Updated"
		})

	})
	.catch((err) => {

		console.log(err)
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
					"dates": "$dates",
					"arrangement_id": "$arrangement_id"
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
					"slot": {$arrayElemAt: [{$filter: {input: {$arrayElemAt: ["$schedules.arrangements", 0]}, as: "element", cond: {$eq: ["$$element._id", "$_id.arrangement_id"]}} }, 0] }
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

		console.log("Result:", resolve);

		resolve = resolve.map(order => new Object({
			orderId: order._id.order_id,
			pickupDate: dateFns.format(new Date(order._id.dates.pickup), "dd-MM-yyyy"),
			status: order._id.status,
			slotString: handler.slotsToString(order._id.slot).string,
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


router.post("/pickup/productImage", (req, res) => {


	var name = req.body.name;
	var img = req.body.image;
	var id = req.body.id;

	console.log(name, id)

	if(!name || !img || !id) {
	  return	res.status(406).json({
			error_msg: "Something is missing"
		})
	}


	// console.log(name, id)


	order.updateOne(
		{
			// "order_id": req.body.orderId,
			"_id": mongoose.Types.ObjectId(id)
		},
		{
			$set: {"product.image": `/images/orders/${name}`, "product.imageStream": img}
		}
	).exec()
	.then(resolve => {

		console.log(resolve)
		res.json({
			status: 201,
			result: resolve
		})

	})
	.catch((err) => {
		res.status(500).json(handler.internalServerError)
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

	order.updateMany(
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

router.get("/delivery/pending", (req, res) => {

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
				"status": "completed"
				// "order_id": "$order_id",
				// $or: [ {"status": "pending"}, {$and: [ {"status": "picked"}, {"movements.picked.checked": false}, {"pickup_id": req.query.id} ]} ],
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"temp_id": "$temp_id",
					"tailor_id": "$tailor_id",
					"status": "$status",
					"dates": "$dates",
					"assigned": "$movements.assigned"
				},
				product: {
					$push: {
						id: "$product.id",
						orderInstanceId: "$_id",
						image: "$product.imageStream"
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
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
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
					"tailor": {$arrayElemAt: ["$tailor", 0]},
					"assigned": "$_id.assigned"
				},
				"products": {
					$push: {
						"id": "$product.id",
						"name": {$arrayElemAt: ["$products.name", 0]},
						"orderInstanceId": "$product.orderInstanceId",
						"image": "$product.image"
					}
				}
			}
		},
		{
			$sort: {"_id.dates.pickup": -1}
		}
	]).exec()
	.then((resolve) => {

		console.log("Result:", resolve);

		resolve = resolve.map(order => new Object({
			orderId: order._id.order_id,
			status: order._id.status,
			// user: {
			// userId: order._id.temp_user._id,
			userName: order._id.temp_user.name,
			tailorName: order._id.tailor.name,
			tailorAddress: order._id.tailor.contact.address.text,
			tailorPhone_no: order._id.tailor.contact.phone_no,
			// userAge: order._id.temp_user.age,
			// userPhone_no: order._id.temp_user.contact.phone_no,
			// },
			products: order.products
		}))

		// console.log("Result:", resolve)

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


router.get("/delivery/picked", (req, res) => {

	// if(!status[req.params.status]) {
	// 	res.send({
	// 		status: 400,
	// 		error_msg: "Not a valid status"
	// 	})
	// }

	let {deliveryId} = req.query

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"deliver_id": mongoose.Types.ObjectId(deliveryId),
				"status": "out"
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"temp_id": "$temp_id",
					"status": "$status",
					"dates": "$dates",
				},
				total_price: {$sum: "$payment.current_price"}
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
				userName: el.temp_user[0].name,
				userAddress: el.temp_user[0].contact.address.text,
				userPhone_no: el.temp_user[0].contact.phone_no,
				totalPrice: (el.total_price<=700  && !el.return)?el.total_price+40:el.total_price
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


router.get("/delivery/delivered", (req, res) => {

	// if(!status[req.params.status]) {
	// 	res.send({
	// 		status: 400,
	// 		error_msg: "Not a valid status"
	// 	})
	// }

	let {deliveryId} = req.query

	order.aggregate([
		{
			$match: {
				"active.status": 1,
				"deliver_id": mongoose.Types.ObjectId(deliveryId),
				"status": {$in: ["delivered", "returned"]}
			}
		},
		{
			$group: {
				_id: {
					"order_id": "$order_id",
					"temp_id": "$temp_id",
					"tailor_id": "$tailor_id",
					"status": "$status",
					"dates": "$dates",
				},
				total_price: {$sum: "$payment.current_price"}
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
				from: "tailors",
				foreignField: "_id",
				localField: "_id.tailor_id",
				as: "tailor"
			}
		},
		{
			$sort: {"_id.dates.pickup": -1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)

		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el._id.order_id,
				userName: el.temp_user[0].name,
				userAddress: el.temp_user[0].contact.address.text,
				tailorName: el.tailor[0].name,
				deliveryPrice: el.total_price<=700?40:0,
				totalPrice: (el.total_price<=700 && !el.return)?el.total_price+40:el.total_price
			}))
		})

	})
	.catch(err => {

		console.log(err)
		res.status(500).json(handler.internalServerError)

	})

})


// NOT_IN_USE
router.put("/delivery/update/taken", (req, res) => {

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


router.put("/delivery/update/picked", (req, res) => {

	let {deliveryId, orderId} = req.body

	order.updateMany(
		{
			status: "completed",
			order_id: orderId,
			"movements.assigned.checked": true
		},
		{
			$set: {"status": "out", deliver_id: mongoose.Types.ObjectId(deliveryId), "movements.out": {"date": new Date(), "checked": true}}
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


router.put("/delivery/update/delivered", (req, res) => {

	let {deliveryId, orderId} = req.body

	order.updateMany(
		{
			status: "out",
			order_id: orderId,
			deliver_id: deliveryId,
			"movements.out.checked": true
		},
		{
			$set: {"status": "delivered", "movements.delivered": {"date": Date.now(), "checked": true}}
		},
		function (err, result) {

			if(err) {
				console.log("ERROR:::\n", err)
				res.json(handler.internalServerError)
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


router.post('/customer/return', async (req, res) => {

	let list = JSON.parse(req.body.list);

	console.log(list)

	if(!list)
	return res.sendStatus(406)

	list = list.map(el => el.id)


	order.find({ _id: {$in: list} }).exec()
	.then(async resolve => {

		let invalidEntries = resolve.filter(el => {return el.status != "delivered"})

		if(invalidEntries.length) {

			res.status(406).json({
				error_msg: "order is not delivered yet"
				// error_msg: "One or more products are already picked, we cannot return picked products"
			})
			throw `Cannot return picked products`

		}

		let today = new Date()
		let pickupDate = dateFns.addDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), 1)
		let slot = await handler.checkAndCreateSlot(pickupDate, "Burari")

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

		let docs = []
		for(let order of resolve) {

			docs.push({
				order_id: order_id,
				product: order.product,
				user_id: order.user_id,
				tailor_id: order.tailor_id,
				"dates.pickup": pickupDate,
				// addresss_id: product.addresss_id,
				arrangement_id: slot.arrangements[0]._id,		//schedule id
				measurements: order.measurements,
				payment: {
					price_id: order.payment.price_id,
					current_price: order.payment.current_price,
					prepaid: false
				},
				temp_id: order.temp_id,
				return: {
					status: 1,
					reference: mongoose.Types.ObjectId(order._id)
				}
			})

		}

		return order.insertMany(docs)

	})
	.then(resolve => {

		console.log(resolve)
		return order.updateMany({_id: {$in: list}}, {$set: {status: "returned"}}).exec()

	})
	.then(resolve => {

		console.log(resolve)
		res.sendStatus(200)

	})
	.catch(err => {

		console.log(err)
		if(typeof err != "string") {
			res.status(500).json({
				error_msg: "Internal Server Error"
			})
		}

	})

})


router.post('/customer/cancel', (req, res) => {

	let orderId = req.body.orderId;

	console.log(orderId, typeof orderId)

	if(!orderId) {
		return res.sendStatus(406)
	}

	order.find({order_id: orderId}).exec()
	.then(resolve => {

		console.log(resolve)

		if(resolve[0].status != "pending") {
			res.status(406).json({
				error_msg: "order already picked"
			})
			throw 'Order already picked'
		}

		return order.updateMany({order_id: orderId}, {$set: {status: "cancelled", "active.cancel.date": new Date()}}).exec()

	})
	.then(resolve => {

		if(resolve.length == 0) {
			res.status(404).json({
				error_msg: "OrderId not found"
			})
			throw `OrderId ${orderId} not found`
		}

		res.status(200).json({
			result: "Order Cancelled"
		})

	})
	.catch(err => {

		console.log(err)
		if(typeof err != "string") {
			res.status(500).json({
				error_msg: "Internal Server Error"
			})
		}

	})

})


router.get("/customer", async (req, res) => {

	let userId = req.query.userId;

	console.log(userId)

	order.aggregate([
		{
			$match: {"user_id": mongoose.Types.ObjectId(userId), "status": {$ne: 'returned'}},
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
					"movements": "$movements",
					"return": "$return"
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
				return: "$_id.return",
				dates: "$_id.dates",
				status: "$_id.status",
				movements: "$_id.movements",
				daysToComplete: {$arrayElemAt: ["$tailor.max_days_to_complete", 0]},
				slot: {$arrayElemAt: [{$filter: {input: {$arrayElemAt: ["$schedules.arrangements", 0]}, as: "element", cond: {$eq: ["$$element._id", "$_id.arrangement_id"]}} }, 0] }
			}
		},
		{
			$sort: {
				"dates.order": -1,
				"order_id": -1
			}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve)
		res.status(200).json({
			result: resolve.map(el => new Object({
				orderId: el.order_id,
				return: el.return?el.return.status:false,
				date: dateFns.format(new Date(el.dates.order), "dd MMM"),
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
				"order_id": orderId,
				// "status": {$ne: 'returned'}
			},
		},
		{
			$lookup: {
				from: "tailors",
				foreignField: "_id",
				localField: "tailor_id",
				as: "tailor"
			}
		},
		{
			$lookup: {
				from: "schedules",
				let: {arrangement_id: "$arrangement_id", pickup_date: "$dates.pickup"},
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
				localField: "temp_id",
				as: "temp_user"
			}
		},
		{
			$lookup: {
				from: "products",
				foreignField: "_id",
				localField: "product.id",
				as: "productDetails"
			}
		},
		{
			$project: {
				order_id: 1,
				product: {
					id: {$arrayElemAt: ["$productDetails._id", 0]},
					orderInstanceId: "$_id",
					name: {$arrayElemAt: ["$productDetails.name", 0]},
					image: "$product.image",
					imageStream: "$product.imageStream",
					price: "$payment.current_price",
					addons: "$addons"
				},
				return: "$return",
				temp_user: {$arrayElemAt: ["$temp_user", 0]},
				dates: "$dates",
				status: "$status",
				movements: "$movements",
				tailorName: {$arrayElemAt: ["$tailor.name", 0]},
				daysToComplete: {$arrayElemAt: ["$tailor.max_days_to_complete", 0]},
				slot: {$arrayElemAt: [{$filter: {input: {$arrayElemAt: ["$schedules.arrangements", 0]}, as: "element", cond: {$eq: ["$$element._id", "$arrangement_id"]}} }, 0] }
			}
		},
		{
			$sort: {"status": 1}
		}
	]).exec()
	.then(resolve => {

		console.log(resolve.filter(el => el.status != "returned" || resolve[0].status == "returned").map(el => el._id))

		if(resolve.length === 0) {
			res.status(404).json({
				error_msg: "Not Found"
			})
			throw `Not found`
		}

		let temp;

		let deliveryPrice = resolve.return? 0 : (resolve.reduce((accumulator, currentValue) => accumulator + currentValue.product.price, 0)<=700?40:0)

		let totalPrice = deliveryPrice + resolve.reduce((accumulator, currentValue) => currentValue.status==="returned"?accumulator:accumulator + currentValue.product.price, 0);

		temp = {
			orderId: resolve[0].order_id,
			pickupDate: dateFns.format(new Date(resolve[0].dates.pickup), "dd MMM"),
			date: dateFns.format(new Date(resolve[0].dates.order), "dd MMM"),
			return: resolve[0].return?resolve[0].return.status:false,
			returnable: (function () {

				console.log("Return:", resolve[0].order_id, resolve[0].status)
				if(resolve[0].status != "delivered")
					return false

				console.log("Return:", resolve[0].order_id, resolve[0].movements.delivered)
				if(resolve[0].movements.delivered.checked == false)
					return false

				let deliveryDate = new Date(resolve[0].movements.delivered.date)
				let today = new Date()
				let inDuration = dateFns.isBefore(today, dateFns.addDays(deliveryDate, handler.defaults.MAXIMUM_RETURN_DURATION))

				console.log("Return:", resolve[0].order_id, inDuration)
				if(inDuration)
					return true

				return false
			})(),
			tailorName: resolve[0].tailorName.split("(")[0],
			status: handler.computeOrderStatus(resolve[0].status, resolve[0].movements),
			slot: handler.slotsToString(resolve[0].slot).string,
			deliveryDate: dateFns.format(dateFns.addDays(new Date(resolve[0].dates.pickup), resolve[0].daysToComplete), "EEE, dd MMM"),
			user: {
				name: resolve[0].temp_user.name,
				age: resolve[0].temp_user.age,
				address: resolve[0].temp_user.contact.address.text
			},
			products: resolve.filter(el => el.status != "returned" || resolve[0].status == "returned").map(el =>
				new Object({
					id: el.product.id,
					orderInstanceId: el.product.orderInstanceId,
					name: el.product.name,
					price: el.product.price,
					image: el.product.image,
					imageStream: el.product.imageStream || "",
					addons: el.product.addons?(el.product.addons.reduce((accumulator, currentValue) => accumulator + ", " + handler.addons[currentValue.id], "").slice(2)):null
				})
			),
			totalPrice,
			deliveryPrice
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
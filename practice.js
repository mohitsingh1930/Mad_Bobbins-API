const mongoose = require("mongoose");

const dateFns = require("date-fns")
mongoose.connect(require("./errorHandlers").defaults.DB_CONNECTION_STRING, {useNewUrlParser: true})

// mongoose.connect("mongodb://localhost/practice", {useNewUrlParser: true})



var price = require("./models/prices")
// var product = require("./models/products").product
// console.log(product)
/**
* Paste one or more documents here
*/
/**
* Paste one or more documents here
*/

// price.create(
// 		[
// 			// simple with salwar : full,half,no
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 2,
// 			"amount": 400
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 12,
// 			"amount": 320
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 10,
// 			"amount": 250
// 		},
// 		// Designer with salwar: full,half,no
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 13,
// 			"amount": 400
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 5,
// 			"amount": 320
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 11,
// 			"amount": 250
// 		},
// 		// simple with pant: full, half, no
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 17,
// 			"amount": 500
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 16,
// 			"amount": 390
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 1,
// 			"amount": 320
// 		},
// 		// Designer with pant: full, half, no
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 20,
// 			"amount": 500
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 21,
// 			"amount": 390
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 22,
// 			"amount": 320
// 		},
// 		// simple blouse: no,yes
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 8,
// 			"amount": 180
// 		},

// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 15,
// 			"amount": 230
// 		},
// 		// Designer blouse: no, yes
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 9,
// 			"amount": 180
// 		},

// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 7,
// 			"amount": 230
// 		},
// 		// Simple kurti: yes, no
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 6,
// 			"amount": 240
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 4,
// 			"amount": 200
// 		},
// 		// Designer kurti: yes, no
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 23,
// 			"amount": 240
// 		},
// 		{
// 			"tailor_id": "5f0a8f096da4e1485048962b",
// 			"product_id": 24,
// 			"amount": 200
// 		}

// 	],
// 	function (err, result) {
// 		if(err) {
// 				console.log("Error", err)
// 			} else {
// 					console.log("Result", result)
// 		}
// 	}
// )
// .then((result) => {
// 		console.log("Result:", result)

// })

var handler = require("./errorHandlers");
const product = require("./models/products").product;
const prices = require("./models/prices");
const { order } = require("./models/orders");
const review = require("./models/reviews")

var schema = new mongoose.Schema({
	name: String,
	order_id: String,
	arr: [{x: String, y:String}],
	arr2: [{type: String, enum:[true, false]}],
	_v: false
})

var model = mongoose.model("test", schema);

// let tailorsList = ["5ee38ff3844a883ee54a1612", "5f0962dd7e723a2ddcc27e41"]
// prices.updateMany(
// 	{
// 		"tailor_id": {$nin: tailorsList},
// 		"product_id": {$nin: [18, 19]},
// 		"amount": {$lte: 300}
// 	},
// 	{
// 		$mul: {"amount": 1.1}
// 	}
// )
// .exec()
// .then(resolve => console.log(resolve))
// .catch(err => console.log(err))

review.aggregate([
	{
		$group: {
			_id: "$tailor_id",
			sum_of_ratings: {
				$sum: "$rating"
			},
			total_ratings: {
				$sum: 1
			}
		}
	}
]).exec()
.then(resolve => {
	console.log(resolve)

	let ratings = [
		"5ee38467844a883ee54a1607",
		"5ee38f7b844a883ee54a1610",
		"5ee38ff3844a883ee54a1612",
		"5f0962dd7e723a2ddcc27e41"
	].map(el => {

		let review = resolve.find(el2 => el2.tailor[0].id===el) ?? {sum_of_ratings: 0, total_ratings: 0}

		return ((4*10 + review.sum_of_ratings)/(10 + review.total_ratings)).toPrecision(2)

	})

	console.log(ratings)


})

// order.find({_id: {$in: ["5f1d132008f7d60017f76c35"]}}).select({measurements: 1})
// // .sort({
// // 	name:
// // })
// .exec()
// .then(async resolve => {

// 	// console.log(resolve)

// 	if(resolve.length == 0)return

// 	let obj = resolve[0].measurements.toObject()

// 	console.log(Object.keys(obj.bottom), Object.keys(resolve[0].measurements.bottom))


// 	// let list = resolve.map(el => new Object({_id: el._id, name: el.name, image: "/" + el.image.split('data/')[1]}))

// 	// console.log(list.length)
// 	// for(let item of list) {

// 	// 	console.log(item.name, item.image)
// 	// 	let updated = await product.updateOne({_id: item._id}, {$set: {"image": item.image}})

// 	// }

// })
// .catch(err => console.log(err))



// let productsTopBottom = [10, 12, 2, 1, 16, 17, 11, 5, 13]
// let productsTop = [4, 6]
// let productsBlouse = [8, 15, 9, 7]

// product.updateMany({_id: {$in: productsBlouse}}, {coverage: ["blouse"]})
// .exec()
// .then(resolve => {
// 	console.log(resolve)
// })
// .catch(err => {
// 	console.log(err)
// })

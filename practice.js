const mongoose = require("mongoose");

const dateFns = require("date-fns")
mongoose.connect(require("./errorHandlers").defaults.DB_CONNECTION_STRING, {useNewUrlParser: true})

// mongoose.connect("mongodb://localhost/practice", {useNewUrlParser: true})



// var price = require("./models/prices")
// var product = require("./models/products").product
// console.log(product)

// price.create(
// 		[
// 			// simple : full,half,no
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 2,
// 			"amount": 1000
// 		},
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 12,
// 			"amount": 550
// 		},
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 10,
// 			"amount": 300
// 		},
// 		// simple with pant: full,half,no
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 17,
// 			"amount": 1200
// 		},
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 16,
// 			"amount": 1000
// 		},
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 1,
// 			"amount": 600
// 		},
// 		// simple blouse: no,yes
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 8,
// 			"amount": 200
// 		},

// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 15,
// 			"amount": 400
// 		},
// 		// kurti: yes, no
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 6,
// 			"amount": 400
// 		},
// 		{
// 			"tailor_id": "5ee38ff3844a883ee54a1612",
// 			"product_id": 4,
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
const { product } = require("./models/products");
const prices = require("./models/prices");
const { order } = require("./models/orders");

var schema = new mongoose.Schema({
	name: String,
	order_id: String,
	arr: [{x: String, y:String}],
	arr2: [{type: String, enum:[true, false]}],
	_v: false
})

var model = mongoose.model("test", schema);

// let obj = {
// 	name: "obj1",
// 	obj2: {
// 		name: "obj2"
// 	}
// }

// console.log(obj??obj3)

// require("./models/tailors").updateMany({}, {active: 1}).exec()
// .then(resolve => console.log(resolve))
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

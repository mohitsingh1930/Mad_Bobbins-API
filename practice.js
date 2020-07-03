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

price.create(
		[
			// simple : full,half,no
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 13,
			"amount": 900
		},
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 5,
			"amount": 500
		},
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 11,
			"amount": 300
		},
		// simple with pant: full,half,no
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 20,
			"amount": 1000
		},
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 21,
			"amount": 750
		},
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 22,
			"amount": 600
		},
		// simple blouse: no,yes
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 9,
			"amount": 300
		},

		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 7,
			"amount": 400
		},
		// kurti: yes, no
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 23,
			"amount": 420
		},
		{
			"tailor_id": "5ee38467844a883ee54a1607",
			"product_id": 24,
			"amount": 220
		}

	],
	function (err, result) {
		if(err) {
				console.log("Error", err)
			} else {
					console.log("Result", result)
		}
	}
)
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

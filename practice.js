const mongoose = require("mongoose");

const dateFns = require("date-fns")
// mongoose.connect(require("./errorHandlers").defaults.DB_CONNECTION_STRING, {useNewUrlParser: true})

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

var schema = new mongoose.Schema({
	name: String,
	order_id: String,
	arr: [{x: String, y:String}],
	arr2: [{type: String, enum:[true, false]}],
	_v: false
})

var model = mongoose.model("test", schema);

const fs = require('fs')
var name = "TestImage.jpg";
var img = "/9j/4QFcRXhpZgAATU0AKgAAAAgABwEAAAQAAAABAAACFQEQAAIAAAAKAAAAYgEBAAQAAAABAAABkAEPAAIAAAAHAAAAbIdpAAQAAAABAAAAhwESAAMAAAABAAAAAAEyAAIAAAAUAAAAcwAAAAByZWFsbWUgVTEAUmVhbG1lADIwMjA6MDY6MjUgMTg6MDQ6NTMAAAekAwADAAAAAQAAAACIJwADAAAAAQVBAACSCgAFAAAAAQAAAOGCmgAFAAAAAQAAAOmSCQADAAAAAQAAAACSCAAEAAAAAQAAAACCnQAFAAAAAQAAAPEAAAAAAAANPgAAA+gAAAH0AAAnEAAAVfAAACcQAAQBEAACAAAACgAAAS8BDwACAAAABwAAATkBEgADAAAAAQAAAAABMgACAAAAFAAAAUAAAAAAcmVhbG1lIFUxAFJlYWxtZQAyMDIwOjA2OjI1IDE4OjA0OjUzAP/gABBKRklGAAEBAAABAAEAAP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAZACFQMBIgACEQEDEQH/xAAfAAAABwEBAQEBAAAAAAAAAAADBAUGBwgJAgABCgv/xAA4EAACAgICAgICAgEFAAEDAAsCAwEEBQYSEwcRCBQhIgAjFQkWJDEyFwozQSU0QhhDUTVSU2GC/8QAHQEAAwEBAQEBAQEAAAAAAAAAAAECAwQFBgcICf/EADoRAAECBAUCBQMDBAIBBQEBAAERIQAxQVECYXGB8JGhAxKxwdEi4fEEEzIFQlJyYoKyBgcUkqIWwv/aAAwDAQACEQMRAD8Aoj83NBZp3kxzVVmhT2GWZKn6FcIlUOFULW4yH0SmTwOSgfYc5kmKCGRSWoV"


async function main() {

	let today = new Date()
	let pickupDate = dateFns.addDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), 1)
	let result = await handler.checkAndCreateSlot(pickupDate, "Burari")
	console.log(result)

}

main()
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

var express = require('express');
var router = express.Router();
var product = require("../models/products").product
var price = require("../models/prices")

var errorHandler = require("../errorHandlers")


/* GET products listing. */

router.get("/", (req, res) => {

	product.find({$and: [{type: "product"}, {active: true}] }, {name: 1, image: 1}).sort({name: -1}).exec()
	.then((resolve) => {

		var temp_arr = [];
		var result = [];
		var temp_result = {};

		for(let i=0; i<resolve.length; i++) {

			let start = resolve[i].name.split(" (")[0]

			if(temp_arr.indexOf(start) == -1) {

				console.log(start)

				temp_arr.push(start);

				if(start.startsWith('Designer')) {
					temp_result.name = start.slice(9)
					temp_result.category = 'Designer'
				}
				else if(start.startsWith('Simple')) {
					temp_result.name = start.slice(7);
					temp_result.category = 'Simple'
				}
				else {
					temp_result.name = start
				}

				temp_result.image = resolve[i].image


				temp_result.type = [];

				for(let el of resolve) {
					if(el.name.startsWith(start) && el.name.split(" (").length>1)
						temp_result.type.push({id: el._id, lining: el.name.split("(")[1].split(" ")[0]})
				}

				result.push(temp_result)
				temp_result = {}
			}


		}

		res.status(200).json({
			result: result
		})
	})
	.catch((err) => {
		console.log("Error:", err);
		res.status(500).json(errorHandler.internalServerError)
	})

})



module.exports = router;

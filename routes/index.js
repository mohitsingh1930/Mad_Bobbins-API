var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken")
var multer = require("multer")

var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, __dirname+"/../formUploads")
	},
	filename: function(req, file, cb) {
		let randomString = require("crypto-random-string")({length: 15})
		console.log("File name:", randomString)
		cb(null, randomString +"."+ file.mimetype.split("/")[1])
	}
})

var upload = multer({storage: storage})

const mongoose = require("mongoose")
// mongoose.connect("mongodb://localhost/practice", {useNewUrlParser: true})



var schema = new mongoose.Schema({
	name: String,
	order_id: String,
	arr: [{x: String, y:String}],
	_v: false
})
var model = mongoose.model("tests", schema);




/* GET home page. */
router.get("/", (req,res) => res.render("index", {title: "API"}))


// router.post('/', function(req, res, next) {

// 	let token = req.headers.authorization.split(" ")[1];
// 	let secret = process.env.secret;

// 	console.log(token, secret)

// 	if(!token || !secret) {
// 		return res.send("Incomplete details")
// 	}

// 	jwt.verify(token, secret, (err, decoded) => {
// 		if(err) {
// 			console.log(err.name, ":", err.message)
// 			res.status(500).json({
// 				err: err.message
// 			})
// 		} else {
// 			console.log("Decoded text:", decoded);
// 			res.status(200).json({
// 				name: decoded.name,
// 				id: decoded.id
// 			})
// 		}
// 	})

// });

router.get("/practice", (req, res) => {

	console.log(req.body)

	res.json(req.body)

})


// router.post('/practice', upload.single("image"), (req, res) => {

// 	model.find().exec().then( (resolve,reject) => {
// 		console.log(resolve)
// 	})

// 	console.log(req.body, req.file)
// 	model.updateOne(
// 		{
// 			"order_id": "2020051410",
// 			// "_id": req.body.id
// 		},
// 		{
// 			$set: {"name": req.file.filename}
// 		}
// 	).exec()
// 	.then((resolve, reject) => {

// 		console.log(resolve)
// 		res.json({
// 			status: 201,
// 			result: resolve
// 		})

// 	})
// 	.catch((err) => {
// 		res.json(handler.internalServerError)
// 	})

// })




module.exports = router;

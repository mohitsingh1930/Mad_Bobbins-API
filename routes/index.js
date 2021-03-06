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
mongoose.connect("mongodb://localhost/practice", {useNewUrlParser: true})



var schema = new mongoose.Schema({
	name: String,
	order_id: String,
	arr: [{x: String, y:String}],
	_v: false
})
var model = mongoose.model("tests", schema);




/* GET home page. */
router.get("/", (req,res) => res.render("index", {title: "API"}))


router.get("/practice", (req, res) => {

	let x;
	let y=null;

	let obj = {
		id: 1,
		name: x,
		rollNo: y
	}

	res.json(obj)

})


router.post("/practice", (req, res) => {

	// const fs = require('fs');
	var name = req.body.name;
	var img = req.body.image;

	console.log(name, img)

	// var realFile = Buffer.from(img,"base64");

	let schema = mongoose.Schema({

		name: String,
		image: String

	})
	let model = mongoose.model("test", schema)

	model.create({
		name,
		image: img
	})
	.then(resolve => console.log(resolve))
	.catch(err => console.log(err))

	// fs.writeFile(`../data/orders/images/${name}`, realFile, function(err) {
	// 	if(err)
	// 		console.log(err);
	// 	else
	// 		console.log("File", name, "saved")
	// });

	res.sendStatus(200)

})



module.exports = router;

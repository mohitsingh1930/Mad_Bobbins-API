const express = require("express")
const router = express.Router()
const dateFns = require("date-fns")
const errorHandler = require("../errorHandlers")

const schedule = require("../models/schedules")
const controller = require("../controllers/schedules")

arrangements = [
	{start: 8, end: 12},
	{start: 17, end: 21}
]


router.get("/", controller)



module.exports = router
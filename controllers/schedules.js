
module.exports = async (req, res) => {

	// if(!req.query.area) {
	// 	res.status(406).json({
	// 		error_msg: "Area is missing"
	// 	})
	// }

	req.query.area = "Burari"

	let pickupDate;
	if(req.query.pickupDate) {

		pickupDate = req.query.pickupDate.split(' ')[0].split('-');
		pickupDate = new Date(pickupDate[0], pickupDate[1]-1, pickupDate[2])

	}
	else {

		pickupDate = new Date();

	}

	console.log(req.query.area, req.query.pickupDate, pickupDate, process.env.MAXIMUM_SCHEDULE_PICKUP)

	if(!dateFns.isBefore(pickupDate, dateFns.add(new Date(), {days: process.env.MAXIMUM_SCHEDULE_PICKUP}))) {
		return res.status(406).json({
			error_msg: "pickup date is too far"
		})
	}

	let slots = await schedule.find({
		$expr: {
			$and: [ {$eq: [ {$dayOfYear: pickupDate}, {$dayOfYear: "$date"}]}, {area: req.query.area} ]
		}
	});

	console.log(slots)

	if(slots.length == 0) {

		try {
			let created = await schedule.create({arrangements, area: req.query.area, date: pickupDate})

			return res.status(201).json({
				result: created.arrangements.map(el => {

					start = (el.start>12)?`${el.start-12} P.M.`:`${el.start} A.M.`;
					end = (el.end>12)?`${el.end-12} P.M.`:`${el.end} A.M.`;
					string = start + " - " + end
					return {id: el._id, start: el.start, end: el.end, string: string};

				})
			})
		}
		catch(err) {
			console.log(err)
			return res.json(errorHandler.internalServerError);
		}

	}


	res.status(200).json({
		result: slots[0].arrangements.map(el => {

			start = (el.start>12)?`${el.start-12} P.M.`:`${el.start} A.M.`;
			end = (el.end>12)?`${el.end-12} P.M.`:`${el.end} A.M.`;
			string = start + " - " + end
			return {id: el._id, start: el.start, end: el.end, string: string};

		})
	})

}
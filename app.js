var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: "7mb" }));
app.use(cookieParser());


// app.use((req, res, next) => {

// 	let token = req.headers.authorization;
// 	if(token == "arlors_secret_token") {
// 		console.log("Authorized")
// 		next()
// 	} else {
// 		console.log("Invalid token", token);
// 		res.send({
// 			status: 401,
// 			error_msg: "Invalid or missing validation token to authenticate"
// 		})
// 	}

// })


app.use(express.static(path.join(__dirname, 'data')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/orders', require("./routes/orders"))
app.use('/workers', require("./routes/workers"))
app.use("/schedules", require("./routes/schedules"))
app.use("/products", require("./routes/products"))
app.use("/reviews", require("./routes/reviews"))

// app.use((req, res, next) => {

// 	res.header("Access-Control-Allow-Origin", "*");
// 	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-type, Accept, Authorization");

// 	if(req.method === "OPTIONS") {
// 		res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE");
// 	}
// })


app.post("/practice/", (req, res) => {
	console.log("Requested at:", req.url, req.baseUrl, req.originalUrl)

	console.log(req.query, req.body)
	res.json({
		baseUrl: req.baseUrl,
		originalUrl: req.originalUrl,
		url: req.url
	})
})


app.use(function(req, res, next) {
// catch 404 and forward to error handler
  next(createError(400));
});


// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	console.log("GLOBAL ERROR:::", err)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

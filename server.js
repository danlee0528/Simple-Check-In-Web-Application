// users-api
var express = require("express");
var http = require("http");
var path = require("path");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
mongoose.connect('mongodb://hla191:t4H3DpQ1@127.0.0.1.27017/cmpt218_hla191?authSource=admin');
var db = mongoose.connection;

db.once('open', function(){	console.log('Connection success');
}).on('error', function(error){	console.log('Connection error', error);	})

/*****	MongoDB	*****/
/* Define Schema*/
var Schema = mongoose.Schema;
// instantiate the constructor
var Users = new Schema({ user_name: String,	user_id: String	});
var CheckIn = new Schema({ check_in_id: String,	history: [Users]	});
// create a singular model from schemas
var check_in_model = mongoose.model('check_in', CheckIn);
var user_model = mongoose.model('user', Users);

/*****	Server	*****/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // for parsing body
app.use("/",express.static(__dirname, '')); // find any files in the directory folder

app.all("/", function(req,res,next){
	console.log(req.method, "request:", req.url, JSON.stringify(req.body));
	next();
});

app.get("/", function(req,res,next){
	res.sendFile(path.join(__dirname +"/login.html"));
});

app.post('/admin_landing.html', function(req,res,next){
	console.log(req.method, "request:", req.url, req.body );
	if (req.body.username !== "admin" || req.body.userpassword !== "1234"){
		console.log('Username or password unmatched!');
		res.redirect('/');
	}else{
		res.sendFile(path.join(__dirname +"/admin_landing.html"));
	}
});

app.post('/check_in_stop.html', function(req,res,next){
	console.log(req.method, "request:", req.url, req.body);

	// create a new model with the given check-in id
	check_in_model.findOne({check_in_id: req.body.admin_check_in_id}, function(err, obj){
		if (err || !obj) {
			console.log('check-in-id <%s> not found', req.body.admin_check_in_id);

			if (err)	{console.log(err);};
			// create a model for the check-in object
			var model = new check_in_model({
				check_in_id: req.body.admin_check_in_id
			});
			// save it to db
			model.save(function(err){
				if (err) {
					console.log('check-in model with id = %s  can not be saved', req.body.admin_check_in_id);
					console.error(err);
				}else{
					console.log('check-in model with id = %s  has been saved', req.body.admin_check_in_id);

					// pass data to viewhistory html page
					check_in_model.findOne(	{check_in_id: req.body.admin_check_in_id})
					.populate({
						path: 'history',
						populate: {
							path: 'history'
						}
					}).exec(function(err, user){

					if (err) {	return handleError(err);	};

					console.log(user.history);

					var htmlpage =
					"<!DOCTYPE html>" +
					"<html>" +
						"<head>"+
							"<meta charset='utf-8/'>" +
							"<link rel = 'stylesheet', href = './style.css'>"+
						"</head>" +
							"<body> <h1> HISTORY </h1>" +
								"<table> " +
									"<tr>"+
										"<th> Nanem </th>"+
										"<th> ID </th></tr>";

					for (i in user.history.toObject()){
						htmlpage += "<tr><td> " + user.history[i].user_name + "</td><td> " + user.history[i].user_id	+ "</td></tr>";
						console.log(user.history[i].user_name, user.history[i].user_id);
					}

						htmlpage += "</table><br>" +
						"<input type='button' value = 'HOME' onclick="+"document.location.href='login.html'"+">" +
						"</body></html>";
						res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': htmlpage.length});
						res.write(htmlpage);
						res.end();
					}); //closure for exec
				} // closure for else
			}); // closure for model.save

		}else{
			console.log('check-in-id: %s found', req.body.admin_check_in_id);
			console.log(obj); // show the record
			res.redirect('back');
		}
	});
});

app.post("/viewHistory.html", function(req,res,next){
	console.log(req.method, "request:", req.url, req.body); // {}
	console.log(req.method, "request:", req.url, req.body.admin_check_in_id); // cmpt218
	// pass data to viewhistory html page
	check_in_model.
	findOne(	{check_in_id: req.body.admin_check_in_id}).
	populate({
		path: 'history',
		populate: {
			path: 'history'
		}
	}).exec(function(err, user){
		if (err) {
			return handleError(err);
		};

		console.log(user.history);

		var htmlpage =
		"<!DOCTYPE html>" +
		"<html>" +
			"<head>"+
				"<meta charset='utf-8/'>" +
				"<link rel = 'stylesheet', href = './style.css'>"+
			"</head>" +
				"<body> <h1> HISTORY </h1>" +
					"<table> " +
						"<tr>"+
							"<th> Nanem </th>"+
							"<th> ID </th></tr>";

		for (i in user.history.toObject()){
			htmlpage += "<tr><td> " + user.history[i].user_name + "</td><td> " + user.history[i].user_id	+ "</td></tr>";
			console.log(user.history[i].user_name, user.history[i].user_id);
		}

			htmlpage += "</table><br>" +
			"<input type='button' value = 'HOME' onclick="+"document.location.href='login.html'"+">" +
			"</body></html>";
		res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': htmlpage.length});
		res.write(htmlpage);
		res.end();
	});

});


app.post('/thankyou.html', function(req,res,next){
	console.log(req.method, "request:", req.url, req.body);

	// find the user_check_in_id
	// then, insert {uname:, uid:} into hisotry of {check_in_id, history[]} in db
	check_in_model.findOne({check_in_id: req.body.user_check_in_str}, function(err, obj){
		if (err || !obj) {
			console.log('check-in-id <%s> not found', req.body.user_check_in_str);
			if (err)	{
				console.log(err);
				window.alert('%s CHECK-IN does not exist', req.body.user_check_in_str);
				res.redirect('back');
			};
		}else{
			console.log('check-in-id: %s found', req.body.user_check_in_str);

			// save user under check_in_id
			check_in_model.update(
				{check_in_id: req.body.user_check_in_str}, // condition
				{ $addToSet: { history: {user_name: req.body.user_check_in_name, user_id:	req.body.user_check_in_id}}},
				function(err){
					if (err) {console.log('PUSH ERROR');};
				}
			);
			console.log('PUSHED!');
		}
	});
	res.sendFile(path.join(__dirname +"/thankyou.html"));

});

app.listen(11526);
console.log("Server is running at port 8080");

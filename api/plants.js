var express = require('express');
var router = express.Router();
var {check, validationResult} = require('express-validator');
var User = require('../models/User');
var Plant = require('../models/Plant');
var mongoose = require('mongoose');
var fs = require('fs');

// Index
router.get('/',
	function(req, res){
		var query = {};
		if(req.query.name) query.name = {$regex:req.query.name, $options:'i'};
		Plant.find(query)
		.sort({name: 1})
		.exec(function(err, plants){
			if(err){
				res.status(500);
				res.json({success:false, message:err});
			} else{
				res.json({success:true, data:plants});
			}
		});
	}
);

// show
router.get('/:id',
	function(req, res, next){
		Plant.findOne({id:req.params.id})
		.exec(function(err, plant){
			if(err){
				res.status(500);
				res.json({success:false, message:err});
			} else if(!plant){
				res.json({success:false, message:"plant not found"});
			} else{
				res.json({success:true, data:plant});
			}
		});
	}
);

// search
router.post('/search',
	function(req, res, next){
		if(!req.body.name) return res.json({success:false, message:"plant name is required"});
		Plant.findOne({name:req.body.name})
		.exec(function(err, plant){
			if(err){
				res.status(500);
				res.json({success:false, message:err});
			} else if(!plant){
				res.json({success:false, message:"plant not found"});
			} else{
				res.json({success:true, data:plant});
			}
		});
	}
);

// comment
router.post('/comment',
	function(req, res, next){
		if(!req.body.name || !req.body.author || !req.body.content)
			return res.json({success:false, message:"name, author, content fields are required"});
		User.findOne({id:req.body.author})
		.exec(function(err, user){
			if(err){
				res.status(500);
				return res.json({success:false, message:err});
			} else if(!user){
				return res.json({success:false, message:(req.body.author + " : user not found")});
			} else{
				res.locals.author = user._id;
			}
		});
		Plant.findOne({name:req.body.name})
		.exec(function(err, plant){
			if(err){
				res.status(500);
				return res.json({success:false, message:err});
			} else if(!plant){
				return res.json({success:false, message:(req.body.name + " : plant not found")});
			} else{
				res.locals.lastid = Object.keys(plant.comments).length;
				next();
			}
		});
	}, function(req, res){ // async problem
		var newComment = {
			'id': res.locals.lastid + 1,
			'author': res.locals.author,
			'content': req.body.content,
//			'date': Date.now(),
//			'like': 0
		};
		console.log(newComment)
		Plant.findOneAndUpdate({name:req.body.name}, {$push:{comments:newComment}})
		.exec(function(err, plant){
			if(err){
				res.status(500);
				return res.json({succcess:false, message:err});
			}
		});
		Plant.findOne({name:req.body.name})
		.exec(function(err, plant){
			if(err){
				res.status(500);
				return res.json({success:false, message:err});
			} else{
				return res.json({success:true, message:plant});
			}
		});
	}
);

router.post('/image',
	function(req, res, next){
		Plant.findOne({name:req.body.name})
		.exec(function(err, plant){
			if(err){
				res.status(500);
				return res.json({success:false, message:err});
			} else{
				res.locals.path = plant.image;
				next();
			}
		});
	}, function(req, res){
		var path = res.locals.path;
		var ext = (/[.]/.exec(path)) ? /[^.]+$/.exec(path) : undefined;	
//		console.log("path : " + path);
//		console.log("ext : " + ext);
		if(ext != "jpg" & ext != "png"){
			return res.json({success:false, message:"there's not 'png' or 'jpg' image file"});
		};
		fs.readFile(path, function(err, image){
			if(err){
				res.status(500);
				return res.json({success:false, message:err});
			}
			else{
				res.writeHead(500, {'Content_type': 'image/'+ext});
				res.end(image);
			}
		});
	}
);

// export
module.exports = router

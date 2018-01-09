// Require the AWS SDK and get the instance of our DynamoDB
var aws = require('aws-sdk');
var iot = new aws.Iot({region: 'us-east-1'});
var fs = require('fs');
// Set up the model for our the email
var model = {
  email: {"S" : ""},
};
var thing_string = "";

// This will be the function called when our Lambda function is exectued
exports.handler = (event, context, callback) => {
  var email = event.body.email;
  var thing = event.body.thing;
  var method = event.body.method;


  // We'll use the same response we used in our Webtask
  const RESPONSE = {
    thingSuccess : {
      statusCode : 200,
      message: "Heres your thing",
      thing_string: thing_string,
      email: email,
        headers: {
         "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
         "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
        }
    },
    OK : {
      statusCode : 200,
      message: "You have successfully subscribed to the newsletter!",
      email: email,
        headers: {
         "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
         "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
        }
    },
    DUPLICATE : {
      status : 400,
      message : "You are already subscribed.",
        headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
        }
    },
    ERROR : {
      status : 400,
      message: "Something went wrong. Please try again.",
        headers: {
      "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
      }
    }
  };

  // Capture the email from our POST request
  // For now, we'll just set a fake email
  console.log("We got inside, let's do crazy shit!!!! ");
  console.log("Email: ", email);
  console.log("Thing: ", thing);
  console.log("Method: ", method);


  if(!email){
    // If we don't get an email, we'll end our execution and send an error
    return callback(null, RESPONSE.ERROR);
  }else{
    model.email.S = email;
    callback(null, RESPONSE.OK);
  }
  
  if(method == "getThing"){
	  var split_email = email.split(".")[0];
	  var thing_file_name = split_email+'_den.txt';
	  var at_split = split_email.split('@');
	  var upcase_email = at_split[0]+at_split[1].toUpperCase();
	  var file_in_s3 = thing_file_name;
	  aws.config.update({region: 'us-east-1', accessKeyId: 'AWS ACCESS',secretAccessKey: 'AWS SECRET'});
	  var s3 = new aws.S3();
	  var getParams = {
	    Bucket: 'mrcatnapsthings', // your bucket name,
	    Key: file_in_s3 // path to the object you're looking for
	  };
  	s3.getObject(getParams, function(err, data) {
	  if (err){
	  	aws.config.update({region: 'us-east-1'});
	  	var params = {
	  	  thingName: upcase_email, /* required */
	  	  attributePayload: {
	  	    attributes: {
	  	      'onTheFlyCreation': thing_file_name,
	  	      /* '<AttributeName>': ... */
	  	    },
	  	    merge: true || false
	  	  }
	  	};
	  	iot.createThing(params, function(err, data) {
	  	  if (err) console.log(err, err.stack); // an error occurred
	  	  else     console.log(data);           // successful response
	  	});
	  	var iot_endpoint = 'API ENDPOINT';
	  	var region = 'us-east-1';
	  	var thing_name = upcase_email;
	  	var file_save = iot_endpoint + ',' + region + ',' + thing_name;
	  	fs.writeFile("thing.txt", file_save, function(err) {
	  	    if(err) {
	  	        return console.log(err);
	  	    }
	  	    var params = {Bucket: 'mrcatnapsthings', Key: thing_file_name, Body: file_save};
	  	    s3.putObject(params, function(err, data) {
	  	      if (err) console.log(err, err.stack); // an error occurred
	  	      else {
	  	      	console.log([thing_name, iot_endpoint, region]);
	  	      	thing_string = thing_name;
	  	      	callback(null, RESPONSE.thingSuccess);
	  	      }           // successful response
	  	    });
	  	});
	  }else{
	  	var getParams = {
	  	    Bucket: 'mrcatnapsthings', // your bucket name,
	  	    Key: thing_file_name // path to the object you're looking for
	  	};
	  	s3.getObject(getParams, function(err, data) {
	  	  if (err){return console.log(err);}
	  	  let thingKey = data.Body.toString('utf-8'); // Use the encoding necessary
	  	  console.log("THING KEY=", thingKey);
	  	  var key_vals = thingKey.split(",");
	  	  var iot_endpoint = key_vals[0];
	  	  var region = key_vals[1];
	  	  var thing_name = key_vals[2];
  	      	console.log([thing_name, iot_endpoint, region]);
  	      	thing_string = thing_name;
	  	    	callback(null, RESPONSE.thingSuccess);
	  	});
	  }
	});
  }
  

  // Insert the email into the database, but only if the email does not already exist.
};
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/porments_db";

// import packages
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes
app.get("/", function(req, res) {
    // Send a message to the client
    res.sendFile("warn.html", {root: 'public'});
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  console.log("app.get /scrape start scrapping");
  axios({
    method:'get',
    url: "https://www.tvguide.com/",
    headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'},
  }).then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab video within an #vidwoCategory tag, and do the following:
    $(".section-content-list-item").each(function(i, element) {
      // Save an empty result object
      let result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).find(".title").text();
      result.link = $(this).find("a.link").attr("href");
      console.log("========= " + i + " =========");
      console.log("result.link=" + result.link + " result.title=" + result.title);
      if (result.title == "") {
        return null;
      }
      result.vkey = result.link.replace("https://www.tvguide.com/news/", "").replace("/", "");
      if (result.link.indexOf("/") === 0) {
        result.link = "https://www.tvguide.com" + result.link 
      }
      let vidDetails = {
        "nviews": $(this).find(".videoDetailsBlock .views var").text(),
        "rating": $(this).find(".videoDetailsBlock .rating-container .value").text(),
        // "thumbnail": $(this).find(".content-image-wrap img.content-image").attr("src"),
        "thumbnail": $(this).find(".content-image-wrap img.content-image").attr("data-amp-src"),
        "tsCrawled": Date.now(), // time stamp -- number of milliseconds elapsed since January 1, 1970 00:00:00 UTC
      }
      result.details = vidDetails;
      console.log(result);
      let query = {vkey: result.vkey};
      let update = result;
      let options = {upsert: true};
      db.VidInfo.findOneAndUpdate(query, update, options, function(err, doc, res){
        if (err) {
          console.log('errrrrror');
          console.log(err);
        } else {
          console.log('successs update');
          console.log(doc);
        }
      });
      // Create a new Article using the `result` object built from scraping
      // db.Article.create(result)
        // .then(function(dbArticle) {
        //   // View the added result in the console
        //   console.log(dbArticle);
        // })
        // .catch(function(err) {
        //   // If an error occurred, log it
        //   console.log(err);
        // });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// A GET route for scraping the comments
app.get("/scrape/:id", function(req, res) {
  console.log("app.get /scrape/:id ");
  // First, we grab the body of the html with axios
  axios({
    method:'get',
    url: "https://www.pornhub.com/video?page=5",
    headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'},
  }).then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab video within an #vidwoCategory tag, and do the following:
    $("#videoCategory li").each(function(i, element) {
      // Save an empty result object
      let result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.vkey = $(this).attr("_vkey");
      result.title = $(this).find(".thumbnail-info-wrapper .title a").text();
      result.link = $(this).find(".thumbnail-info-wrapper .title a").attr("href");
      if (result.link.indexOf("/") === 0) {
        result.link = "https://www.pornhub.com" + result.link 
      }
      let vidDetails = {
        "nviews": $(this).find(".videoDetailsBlock .views var").text(),
        "rating": $(this).find(".videoDetailsBlock .rating-container .value").text(),
        "thumbnail": $(this).find(".phimage img").attr("src"),
        "tsCrawled": Date.now(), // time stamp -- number of milliseconds elapsed since January 1, 1970 00:00:00 UTC
      }
      result.details = vidDetails;
      //console.log(result);
      let query = {vkey: result.vkey};
      let update = result;
      let options = {upsert: true};
      db.VidInfo.findOneAndUpdate(query, update, options, function(err, doc, res){
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });
      // Create a new Article using the `result` object built from scraping
      // db.Article.create(result)
        // .then(function(dbArticle) {
        //   // View the added result in the console
        //   console.log(dbArticle);
        // })
        // .catch(function(err) {
        //   // If an error occurred, log it
        //   console.log(err);
        // });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});


// Route for getting all Articles from the db
app.get("/videos", function(req, res) {
  console.log("app.get /videos ");
  // Grab every document in the Articles collection
  db.VidInfo.find({}).sort({ _id: 1 }).limit(40)
    .then(function(dbVidInfo) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbVidInfo);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific VidInfo by id, populate it with it's note
app.get("/videos/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.VidInfo.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbVidInfo) {
      // If we were able to successfully find an VidInfo with the given id, send it back to the client
      res.json(dbVidInfo);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an VidInfo's associated Note
app.post("/videos/:id", function(req, res) {
  console.log(req.body);
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one VidInfo with an `_id` equal to `req.params.id`. Update the VidInfo to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.VidInfo.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbVidInfo) {
      // If we were able to successfully update an VidInfo, send it back to the client
      res.json(dbVidInfo);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

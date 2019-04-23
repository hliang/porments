var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new VidInfoSchema object
// This is similar to a Sequelize model
var VidInfoSchema = new Schema({
  // video id
  vkey: {type: String, unique: true},
  // `title` is of type String
  title: String,
  // `link` is of type String
  link: String,
  // basic info
  details: { },
  // comments
  comments: [ ],
  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the VidInfo with an associated Note
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

// This creates our model from the above schema, using mongoose's model method
var VidInfo = mongoose.model("VidInfo", VidInfoSchema);

// Export the Note model
module.exports = VidInfo;

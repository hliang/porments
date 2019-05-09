function randomImg() {
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var url = "https://i.imgur.com/";
  var ext = ['.jpg','.png'];
  imgIdLenOptions = [5, 7];

  function generateLink() {
    elements = [];
    rand = imgIdLenOptions[Math.floor(Math.random() * imgIdLenOptions.length)];
    for (let i = 0; i < parseInt(rand); i++) {
      elements.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    return url + elements.join("");
  }

  function testPage(url) {
    let isValid = false;
    $.ajax({
      url: url,
      type: "get",
      async: false,
      success: function(data) {
        console.log("goood");
        console.log(data.length);
        if (data.length != 484) {
          isValid = true;
        }
      }, 
      error: function(){
        isValid = false;
      }
      // statusCode: {
      //   200: function() {
      //     alert('200 status code!');
      //     return true;
      //   }
      // }
      // success: function(data) {
      //   console.log("goood");
      //   return true;
      // },
      // error: function(err) {
      //   console.log(err);
      //   return false;
      // }
    });
    return isValid;
  }

  let tries = 20;
  while (tries > 0) {
    for (var end of ext) {
    // ext.forEach(function(end){
      link = generateLink() + end;
      if (testPage(link)) {
        return link;
      }
    };
    tries = tries - 1;
  }
}


var randImgUrl = randomImg();
console.log("img=" + randImgUrl);

// Grab the articles as a json
$.getJSON("/videos", function(data) {
  var maxvid = 20;
  // For each one
  console.log("getjson /videos");
  console.log(data);
  for (var i = 0; i < data.length && i < maxvid; i++) {
    // Display the apropos information on the page
    console.log(data[i]);
    var imgtag = $("<img>", {
      src: data[i].details.thumbnail.indexOf('data:image') == 0 ? randomImg() : data[i].details.thumbnail,
      // src: data[i].details.thumbnail,
      // "data-pixelate": "",
      // "data-value": "0.1",
      // "data-reveal": true,
    });
    var atag = $("<a>", {
      text: data[i].title,
      class: "vidtitle",
      href: data[i].link,
    });
    
    var divtag = $("<button class='vidcomment'/ >").text(" notes");
    var addtag = $("<button class='addcomment' />").text(" edit");
    var commenttag = $("<div>").append(divtag).append(addtag);
    // atag.append(imgtag);
    var litag = $("<li class='vidbox' />").append(imgtag).append(atag).append(commenttag);
    litag.attr("data-id", data[i]._id);
    // $("#videos-wrapper ul").append("<li><p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p></li>");
    $("#videos-wrapper ul").append(litag);
    $("[data-id=" + data[i]._id + "] img").pixelate({ value: 0.05, reveal: true });
    // $("[data-id=" + data[i]._id + "] img").foggy({
    //   blurRadius: 10,          // In pixels.
    //   opacity: 0.9,           // Falls back to a filter for IE.
    //   cssFilterSupport: true  // Use "-webkit-filter" where available.
    // });
  }
});


// Get the modal
// var modal = $('#notesModal');

// // Get the button that opens the modal
// var vidboximg = $(".vidbox img");

// // When the user clicks on the button, open the modal 
// vidboximg.onclick = function() {
//   console.log("vidboximg")
//   modal.style.display = "block";
// }

// // When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//   if (event.target == modal) {
//     modal.style.display = "none";
//   }
// }
// $(document).on("click", ".vidbox img", function() {
//   $("#notesModal").show();
// });
$(document).on("click", ".close", function() {
  $("#notesModal").hide();
});


// Whenever someone clicks a p tag
$(document).on("click", ".vidcomment", function() {
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).closest("li").attr("data-id");
  var thisTitle = $(this).closest(".vidbox").find(".vidtitle").text();
  $("#notesModal").show();
  $(".modal-header h3").text(thisTitle);
  $.ajax({
    method: "GET",
    url: "/videos/" + thisId,
  })
  .then(function(data) {
    console.log(data);
    if (data.note != null) {
      var notetag = $("<div>")
      .append($("<h4>").text(data.note.title))
      .append($("<p>").text(data.note.body));
      $("#notes").append(notetag);
    }
  });

});


// Whenever someone clicks a p tag
$(document).on("click", ".addcomment", function() {
  
  // Save the id from the p tag
  var thisId = $(this).closest("li").attr("data-id");;
  var thisTitle = $(this).closest(".vidbox").find(".vidtitle").text();
  $("#notesModal").show();
  $(".modal-header h3").text(thisTitle);
  // Empty the notes from the note section
  $("#notes").empty();

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/videos/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      // $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/videos/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log("submit and get response:");
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});


// scrape button clicked
$(document).on("click", "#btn-scrape", function() {

  $.ajax({
    method: "GET",
    url: "/scrape"
  })
    // With that done, add the note information to the page
    .then(()=>{
      $("#btn-scrape").text("Yeah! Scraping Done");
    });
});
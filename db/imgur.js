const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require("fs");
const path = require('path');

async function postImg(post) {

  var formdata = new FormData();
  formdata.append("image", post.image);

  var requestOptions = {
    method: 'POST',
    headers: {
      Authorization: "Client-ID 3435e574a9859d1",
    },
    body: formdata,
    redirect: 'follow'
  };

  return fetch("https://api.imgur.com/3/image", requestOptions)
    .then(response => response.json())
    .catch(error => error.json());
}


async function postVideo(video) {
  var formdata = new FormData();
  formdata.append("video", video);
  formdata.append("type", 'base64');

  var requestOptions = {
    method: 'POST',
    headers: {
      Authorization: "Client-ID 3435e574a9859d1",
    },
    body: formdata,
    redirect: 'follow'
  };

  return fetch("https://api.imgur.com/3/upload", requestOptions)
  .then(response => response.json())
  .catch(error => error.json());
}

// async function postVideo(video) {
//     var formdata = new FormData();
//     formdata.append("video", fs.readFileSync(__dirname + `/../${video}`, 'utf8'));
//     formdata.append('type', 'file');
//     formdata.append('disable_audio','1');

//     var requestOptions = {
//       method: 'POST',
//       headers: {
//         Authorization: "Client-ID 3435e574a9859d1",
//       },
//       body: formdata,
//       redirect: 'follow'
//     };

//     return fetch("https://api.imgur.com/3/upload", requestOptions)
//     .then(response => {
//       console.log(response);
//       response.json()
//     })
//     .catch(error => error.json());
// }


module.exports.postImg = async function(){
	return postImg();
}

module.exports.postVideo = async function(){
	return postVideo();
}

module.exports = {
  postImg,
  postVideo,
}
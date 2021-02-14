const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require("fs");

async function postImg(post) {

  var formdata = new FormData();
  formdata.append("image", post.image);

  var requestOptions = {
    method: 'POST',
    headers: {
      Authorization: "Client-ID 3435e574a9859d1",
      // 'Content-Type': "application/octet-stream",
    },
    body: formdata,
    redirect: 'follow'
  };

  return fetch("https://api.imgur.com/3/image", requestOptions)
    .then(response => response.json())
    .catch(error => error.json());
}

async function postGif(filepath, filename) {
  var formdata = new FormData();
    if (fs.existsSync(filepath)) {
      //file exists
      const gifFile = fs.readFileSync(filepath);
      formdata.append("image", gifFile,filename);
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
      .catch(error => error);
    } else {
      return {error: 'erro na conexão com imgur.'};
    }
}

async function postVideo(filepath, filename) {
  var formdata = new FormData();
    if (fs.existsSync(filepath)) {
      //file exists
      const videoFile = fs.readFileSync(filepath);
      formdata.append("video", videoFile,filename);
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
      .catch(error => error);
    } else {
      return {error: 'erro na conexão com imgur.'};
    }
}

async function deleteImgur(deletehash) {
	return fetch(`https://api.imgur.com/3/image/${deletehash}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Client-ID 3435e574a9859d1',
        },
        redirect: 'follow',
      })
		.then(response => response.json())
		.catch(error => error);
}

module.exports.postImg = async function(){
	return postImg();
}
module.exports.postGif = async function(){
	return postGif();
}
module.exports.postVideo = async function(){
	return postVideo();
}
module.exports.deleteImgur = async function(){
	return deleteImgur();
}

module.exports = {
  postImg,
  postVideo,
  deleteImgur,
  postGif,
}

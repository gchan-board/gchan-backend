const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require("fs");

async function postImg(filepath, filename) {
  const form = new FormData();
  if (!fs.existsSync(filepath)) {
    return { status_code: 500, details: "We couldn't find your image! Please try uploading one more time." }
  }
  const imgFile = fs.readFileSync(filepath);
  form.append("image", imgFile, filename);
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
    },
    body: form,
    redirect: 'follow'
  };

  return fetch("https://api.imgur.com/3/image", requestOptions)
  .then(response => response.json())
  .catch(error => error);
}

async function postVideo(filepath, filename) {
  const formdata = new FormData();
  if (!fs.existsSync(filepath)) {
    return { status_code: 500, details: "We couldn't find your video! Please try uploading one more time." }
  }
  const videoFile = fs.readFileSync(filepath);
  formdata.append("video", videoFile,filename);
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
    },
    body: formdata,
    redirect: 'follow'
  };
    
  return fetch("https://api.imgur.com/3/upload", requestOptions)
  .then(response => response.json())
  .catch(error => error);
}

async function deleteImgur(deletehash) {
	return fetch(`https://api.imgur.com/3/image/${deletehash}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
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

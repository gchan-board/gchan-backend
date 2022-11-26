const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require("fs");
const { mockImgurUpload, mockImgurDelete, mockImgurInformation } = require('../helpers');
const environment = process.env.NODE_ENV;

async function postImg(filepath, filename) {
  if (!fs.existsSync(filepath)) {
    return { status_code: 500, details: "We couldn't find your image! Please try uploading one more time." }
  }
  const imgFile = fs.readFileSync(filepath);
  if (environment === 'development') return mockImgurUpload(filepath);
  const form = new FormData();
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
  if (!fs.existsSync(filepath)) {
    return { status_code: 500, details: "We couldn't find your video! Please try uploading one more time." }
  }
  const videoFile = fs.readFileSync(filepath);
  if (environment === 'development') return mockImgurUpload(filepath);
  const formdata = new FormData();
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
  if (environment === 'development') return mockImgurDelete();
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

async function getInformation(imgur_id) {
  if (environment === 'development') return mockImgurInformation();
  const response = await fetch(`https://api.imgur.com/3/image/${imgur_id}`, {
    method: 'GET',
    headers: {
      Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
    },
    redirect: 'follow'
  });
  if (!response.ok) {
    return {
      status: 404,
      details: 'File not found.'
    }
  }
  return response.json();
}

module.exports.postImg = async function(){
	return postImg();
}

module.exports.postVideo = async function(){
	return postVideo();
}

module.exports.deleteImgur = async function(){
	return deleteImgur();
}

module.exports.getInformation = async function(){
  return getInformation();
}

module.exports = {
  postImg,
  postVideo,
  deleteImgur,
  getInformation,
}

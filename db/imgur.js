async function postImg(post) {
  const fetch = require('node-fetch');
  const FormData = require('form-data');

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

module.exports.postImg = async function(){
	return postImg();
}

module.exports = {
  postImg,
}
const express = require('express');
//login functionality
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
//middleware below
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const unless = function(path, middleware) {
  return function(req, res, next) {
    if (path.includes(req.path)) {
        return next();
    } else {
        return middleware(req, res, next);
    }
  };
};

const fileUpload = require('express-fileupload');

// para receber imagens/videos e enviar pro imgur
const multer  = require('multer');
const uuid = require('uuid').v4;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, `${uuid()}-${originalname}`);
  }
});
const upload = multer({ storage });

const login = require('./db/login');
const messages = require('./db/messages'); //require é no nome do arquivo sem a extensão
const marquees = require('./db/marquees');
const replies = require('./db/replies');
const placeholders = require('./db/placeholders');
const imgur = require('./db/imgur');
const db =  require('./db/connection');
const app = express();
// sonic -- início --
const { Ingest, Search } = require('sonic-channel');
const sonicChannelIngest = new Ingest({
    host: '::1',
    port: 1491,
    auth: 'SecretPassword',
});
sonicChannelIngest.connect({
    connected: () => {
        console.log('Sonic Ingest conectou');
    },
    disconnected : (e) => {
        console.error('Sonic Ingest desconectou', e);
    },
    timeout : (e) => {
        console.error('Sonic Ingest timeout', e);
    },
    retrying : (e) => {
        console.info('Sonic Ingest retrying', e);
    },
    error: (e) => {
        return;
        console.error(e);
    }
});
const sonicChannelSearch = new Search({
    host: '::1',
    port: 1491,
    auth: process.env.SONIC_PW,
});
const conect_tst = sonicChannelSearch.connect({
    connected: () => {
        console.log('Sonic Search conectou');
    },
    disconnected : (e) => {
        console.error('Sonic Search desconectou', e);
    },
    timeout : (e) => {
        console.error('Sonic Search timeout', e);
    },
    retrying : (e) => {
        console.info('Sonic Search retrying', e);
    },
    error: (e) => {
        return;
        console.error('biru ru',e);
    }
});

function sonic_register_post(id, username, subject, message) {
  sonicChannelIngest.push('posts', 'default',`post:${id}`, `${username} ${subject} ${message}`, {
    lang: 'por'
  }).then(() => console.log(`post #${id} indexado na busca.`))
  .catch((e) => console.error(`erro ao indexar post #${id}`, e));
}
function sonic_register_reply(message_id, id, username, content){
  sonicChannelIngest.push('replies', 'default',`post:${message_id}:reply:${id}`, `${username} ${content}`, {
    lang: 'por'
  }).then(() => console.log(`reply #${id} indexada na busca.`))
  .catch((e) => console.error(`erro ao indexar reply #${id}`, e));
}

// sonic -- fim --

app.use(unless(['/videoupload','/gifupload','/imgupload'], fileUpload()));

app.use(morgan('tiny'));

const corsOptions = {
  origin: process.env.CORS_ORIGIN_URL, // 'https://guites.github.io',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// para receber imagens/videos e enviar pro imgur
app.use(express.static('uploads'))

app.use(flash());
const initializePassport = require('./db/passport-config');
initializePassport(
  passport, 
  email => findUserByEmail(email),
  id => findUserById(id)
);
async function findUserById(id){
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1;',[id]);
  return rows[0];
};
async function findUserByEmail(email){
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1;',[email]);
  return rows[0];
};

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/',(req,res) => {
  res.json({
		message: "fullstack msg board."
	})
});

app.post('/', (req,res) => {
  return res.json('lel');
})

app.get('/messages', async (req,res) => {
  // const allMsgs = {};
  // allMsgs.msgs = await messages.getAll();
  // if(req.isAuthenticated()){
  //   allMsgs.user = req.user;
  // }
  // res.json(allMsgs);
	messages.getAll().then((allMessages) => {
		res.json(allMessages);
	});
});

app.get('/messages/:offset', async (req, res) => {
  messages.getAllOffset(req.params.offset).then((messages) => {
    res.json(messages);
  })
})

app.get('/message/:id', async (req, res) => {
  messages.getOne(req.params.id).then((message) => res.json(message));
})

app.get('/replies/:id', async (req, res) => {
  replies.getReplyFromMessageId(req.params.id).then(replies => res.json(replies));
})

app.get('/reply/:id', async (req, res) => {
  replies.getOne(req.params.id).then(reply => res.json(reply));
});

app.get('/marquee', async (req, res) => {
  marquees.getAll().then((allMarquees) => {
    res.json(allMarquees);
  });
});

// app.post('/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/login',
// }))

app.get('/login', function (req, res, next) {
  if (req.isAuthenticated()) {
    return res.send(req.user);
  } else {
    return res.send(false);
  }
});

app.get('/placeholders', async function(req, res, next) {
  placeholders.getRandom().then((placeholder) => {
    const protc = req.secure ? 'https://' : 'http://';
    res.redirect(protc + req.get('host') + '/placeholders/' + placeholder.results[0].file);
  })
});

app.get('/placeholders/:file', function(req, res, next) {
  res.sendFile(__dirname + '/placeholders/' + req.params.file);
});

app.post('/login', function(req, res, next) {
  // console.log(req.body);
  passport.authenticate('local', function(err, user, info) {
    console.log(user);
    if(err) { return res.redirect('/info'); }
    if(!user) { console.log(info); return res.json(info); }
    req.login(user, function(err) {
      if(err) { return next(err); }
      if(req.isAuthenticated()){
        return res.json(req.user);
      }
    })
  })(req,res,next);
});

app.post('/register', async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    };
    const { rows } = await db.query('INSERT INTO users (name,email,password) VALUES ($1,$2,$3);',[user.name,user.email,user.password]);
    res.json('success');
  } catch (e) {
    console.log(e);
    res.json(false);
  }
})

app.post('/messages', async (req,res) => {
	messages.postMessage(req).then((message) => {
    if(!message.error && !message.details){
      const parsedMessage = JSON.parse(message);
      if (!parsedMessage.error && !parsedMessage.details){
        sonic_register_post(parsedMessage.id, parsedMessage.username, parsedMessage.subject, parsedMessage.message);
      }
    }
		res.json(message);
	});
});

app.post('/replies', async (req, res) => {

  replies.postReply(req).then((reply) => {
    console.log(reply);
    if (!reply.error && !reply.details) {
      const parsedReply = JSON.parse(reply);
      sonic_register_reply(parsedReply.message_id, parsedReply.id, parsedReply.username, parsedReply.content);
    }
    res.json(reply);
  })

})

app.post('/marquee', async (req, res) => {

  marquees.postMarquee(req.body).then((marquee) => {
    res.json(marquee);
  });

});

app.post('/slack', async (req, res) => {
  console.log(req.body);
  messages.postMessageFromSlack(req).then((message) => {
    res.json(message);
  });
})

// app.use(fileUpload());
// app.post('/imgupload', async (req, res) => {
//   imgur.postImg(req.body).then(resp => {
//     res.json(resp);
//   })
// })
app.post('/imgupload', upload.single('image'), async (req, res) => {
  imgur.postImg(req.file.path, req.file.originalname).then(resp => {
    res.json(resp);
  })
})
app.post('/gifupload', upload.single('image'), async (req, res) => {
  imgur.postGif(req.file.path, req.file.originalname).then(resp => {
    res.json(resp);
  })
})
app.post('/videoupload', upload.single('video'), async (req, res) => {
  imgur.postVideo(req.file.path, req.file.originalname).then(resp => {
    res.json(resp);
  })
})
// rotas para uso do sonic
// registro de posts
app.post('/sonic-register-posts', async (req, res) => {
    const { subject, message, id } = req.body;
    // Cadastrar posts no banco
    await sonicChannelIngest.push('posts', 'default', `post:${id}`, `${subject} ${message}`, {
        lang: 'por'
    })
    res.status(201).send();
});
// registro de replies
app.post('/sonic-register-replies', async (req, res) => {
    const { post_id, id, content } = req.body;
    // Cadastrar posts no banco
    await sonicChannelIngest.push('replies', 'default', `reply:${id}`, `${post_id} ${content}`, {
        lang: 'por'
    })
    res.status(201).send();
});

//registra todos posts
app.get('/sonic-register-all-posts', async (req, res) => {
    const list = [];
    const allMsgs = await messages.getAll();
    for (let i = 0; i < allMsgs.results.length; i++) {
        var msg = allMsgs.results[i];
       await sonicChannelIngest.push('posts', 'default',`post:${msg.id}`, `${msg.username} ${msg.subject} ${msg.message}`, {
           lang: 'por'
       });
       list.push(msg.id);
    }
    res.json(list);
});
// registra todas as respostas
app.get('/sonic-register-all-replies', async (req, res) => {
  const list = [];
  const allReplies = await replies.getAll();
  for (let i = 0; i < allReplies.results.length; i++) {
    var reply = allReplies.results[i];
    await sonicChannelIngest.push('replies', 'default',`post:${reply.message_id}:reply:${reply.id}`, `${reply.username} ${reply.subject} ${reply.content}`, {
      lang: 'por'
    });
    list.push(reply.id);
  }
  res.json(list);
});

app.get('/search-posts', async (req, res) => {
  const { q } = req.query;
  if (!q) return;
  try {
    const ping = await sonicChannelSearch.ping();
    const results = await sonicChannelSearch.query(
      'posts',
      'default',
      q,
      { lang : 'por'}
    );
    res.json(results);
  } catch(e) {
    // cai neste catch se o servidor de busca estiver fora
    res.status(503).json({message: "Servidor de busca em manutenção."});
  }
});
app.get('/search-replies', async (req, res) => {
    const { q } = req.query;
    if (!q) return;
    try {
      const ping = await sonicChannelSearch.ping();
      const results = await sonicChannelSearch.query(
        'replies',
        'default',
        q,
        { lang : 'por'}
      );
      res.json(results);
    } catch(e) {
      // cai neste catch se o servidor de busca estiver fora
      res.status(503).json({message: "Servidor de busca em manutenção."});
    }
});

// -- rota sonic suggest fora de uso --
// app.get('/sonic-suggest', async (req, res) => {
//     const { q } = req.query;
// 
//     const results = await sonicChannelSearch.suggest(
//         'posts',
//         'default',
//         q,
//         { limit: 5 }
//     );
// 
//     return res.json(results);
// });
// -- rota sonic suggest fora de uso --

app.delete('/logout', (req, res) => {
  req.logOut();
  res.json({login: false});
})

app.delete('/message/:id', (req, res) => {
  if(req.isAuthenticated()){
    messages.deleteMessage(req.params.id).then((msg) => {
      res.json(msg);
    })
  } else {
    res.status(401).send('Necessário login via aplicação.');
  }
})

app.delete('/imgur/:deletehash', (req, res) => {
	imgur.deleteImgur(req.params.deletehash).then(resp => {
		res.json(resp);
	})
})
// function checkAuthenticated(req, res, next){
//   if(req.isAuthenticated)
// }


const port = process.env.PORT || 4450;
app.listen(port, () => {
	console.log(`Listening on ${port}.`);
});

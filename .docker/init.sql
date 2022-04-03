-- sets up database for local backend server
-- if you change this file, you will have to delete the created volume and rebuild the container

CREATE USER gchan WITH PASSWORD 'gchan';
CREATE DATABASE gchan;
GRANT ALL PRIVILEGES ON DATABASE gchan TO gchan;
\c gchan;

-- MESSAGES TABLE
CREATE TABLE messages (
    username character varying,
    subject character varying,
    message text,
    imageurl character varying,
    giphyurl character varying,
    options character varying,
    id integer NOT NULL,
    created timestamp without time zone DEFAULT now(),
    user_id integer DEFAULT 0,
    slack_id character varying DEFAULT 0,
    gif_origin text DEFAULT ''::text,
    updated_at timestamp without time zone DEFAULT now(),
    deleted boolean DEFAULT false
);
-- set auto increment to id field
CREATE SEQUENCE messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE messages_id_seq OWNED BY messages.id;
ALTER TABLE ONLY messages ALTER COLUMN id SET DEFAULT nextval('messages_id_seq'::regclass);
-- combination of message, subject and imageurl must be unique
ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_message_imageurl_subject_key UNIQUE (message, imageurl, subject);
-- set primary key as id field
ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

-- REPLIES TABLE
CREATE TABLE replies (
    id integer NOT NULL,
    message_id integer NOT NULL,
    content text NOT NULL,
    username character varying(255) NOT NULL,
    imageurl character varying(255),
    user_id character varying(255),
    created timestamp without time zone DEFAULT now() NOT NULL
);
-- set auto increment to id field
CREATE SEQUENCE replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE replies_id_seq OWNED BY replies.id;
ALTER TABLE ONLY replies ALTER COLUMN id SET DEFAULT nextval('replies_id_seq'::regclass);
-- sets foreign key to message_id field
ALTER TABLE ONLY replies
    ADD CONSTRAINT message_reply FOREIGN KEY (message_id) REFERENCES messages(id);

-- PLACEHOLDER TABLE
CREATE TABLE placeholders (
    id integer NOT NULL,
    file character varying(255)
);
-- set auto increment to id field
CREATE SEQUENCE placeholders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE placeholders_id_seq OWNED BY placeholders.id;
ALTER TABLE ONLY placeholders ALTER COLUMN id SET DEFAULT nextval('placeholders_id_seq'::regclass);
-- constraints placeholder image to be unique
ALTER TABLE ONLY placeholders
    ADD CONSTRAINT placeholders_file_key UNIQUE (file);

-- MARQUEE TABLE
CREATE TABLE marquees (
    id integer NOT NULL,
    content text,
    created date,
    has_url text,
    href text
);
CREATE SEQUENCE marquees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE marquees_id_seq OWNED BY marquees.id;
ALTER TABLE ONLY marquees ALTER COLUMN id SET DEFAULT nextval('marquees_id_seq'::regclass);
-- constraints marquee content to be unique 
ALTER TABLE ONLY marquees
    ADD CONSTRAINT marquees_content_key UNIQUE (content);

-- POST_LOGS TABLE
CREATE TABLE post_logs (
    id integer NOT NULL,
    table_pk integer NOT NULL,
    table_name character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    x_real_ip character varying(255),
    remoteaddress character varying(255),
    x_forwarded_for text,
    score character varying(255)
);
-- sets auto increment for id field
CREATE SEQUENCE post_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE post_logs_id_seq OWNED BY post_logs.id;
ALTER TABLE ONLY post_logs ALTER COLUMN id SET DEFAULT nextval('post_logs_id_seq'::regclass);
ALTER TABLE ONLY post_logs
    ADD CONSTRAINT post_logs_pkey PRIMARY KEY (id);
-- primary key and table name as an unique combination, ex. table messages can only have one post with id = 3
ALTER TABLE ONLY post_logs
    ADD CONSTRAINT unique_id UNIQUE (table_pk, table_name);

-- table USERS is currently not being used
CREATE TABLE users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL
);
CREATE SEQUENCE users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE users_id_seq OWNED BY users.id;
ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);

-- table IP_LOGS is currently out of use (POST_LOGS is being used instead)
CREATE TABLE ip_logs (
    id integer NOT NULL,
    x_real_ip character varying(255),
    remoteaddress character varying(255),
    x_forwarded_for text,
    score character varying(255)
);
CREATE SEQUENCE ip_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE ip_logs_id_seq OWNED BY ip_logs.id;
ALTER TABLE ONLY ip_logs ALTER COLUMN id SET DEFAULT nextval('ip_logs_id_seq'::regclass);

-- set table owners to gchan user
ALTER TABLE ip_logs OWNER TO gchan;
ALTER TABLE users OWNER TO gchan;
ALTER TABLE post_logs OWNER TO gchan;
ALTER TABLE marquees OWNER TO gchan;
ALTER TABLE placeholders OWNER TO gchan;
ALTER TABLE replies OWNER TO gchan;
ALTER TABLE messages OWNER TO gchan;

-- insert dummy messages data
INSERT INTO messages (username, subject, message, imageURL, user_id) VALUES 
('Demetrius', 'His mother had always taught him', 'His mother had always taught him not to ever think of himself as better than others. Hed tried to live by this motto. He never looked down on those who were less fortunate or who had less money than him. But the stupidity of the group of people he was talking to made him change his mind.', 'https://purr.objects-us-east-1.dream.io/i/lucy.jpg', '0'), 
('Trace', 'He was an expert but not in a discipline', 'He was an expert but not in a discipline that anyone could fully appreciate. He knew how to hold the cone just right so that the soft server ice-cream fell into it at the precise angle to form a perfect cone each and every time. It had taken years to perfect and he could now do it without even putting any thought behind it.', 'https://purr.objects-us-east-1.dream.io/i/093_-_hIk6qYC.gif', '0'), 
('Kaya', 'Dave watched as the forest burned up on the hill.', 'Dave watched as the forest burned up on the hill, only a few miles from her house. The car had been hastily packed and Marta was inside trying to round up the last of the pets. Dave went through his mental list of the most important papers and documents that they couldnt leave behind. He scolded himself for not having prepared these better in advance and hoped that he had remembered everything that was needed. He continued to wait for Marta to appear with the pets, but she still was nowhere to be seen.', 'https://purr.objects-us-east-1.dream.io/i/bcc59ac212954b9f88dbd0e0cc006a82.jpg', '0'), 
('Assunta', 'All he wanted was a candy bar.', 'All he wanted was a candy bar. It didnt seem like a difficult request to comprehend, but the clerk remained frozen and didnt seem to want to honor the request. It might have had something to do with the gun pointed at his face.', 'https://purr.objects-us-east-1.dream.io/i/xbLFu.jpg', '0'), 
('Nicklaus', 'Hopes and dreams were dashed that day.', 'Hopes and dreams were dashed that day. It should have been expected, but it still came as a shock. The warning signs had been ignored in favor of the possibility, however remote, that it could actually happen. That possibility had grown from hope to an undeniable belief it must be destiny. That was until it wasnt and the hopes and dreams came crashing down.', 'https://purr.objects-us-east-1.dream.io/i/sGmv1Az.jpg', '0'), 
('Coralie', 'Dave wasnt exactly sure how he had ended up', 'Dave wasnt exactly sure how he had ended up in this predicament. He ran through all the events that had lead to this current situation and it still didnt make sense. He wanted to spend some time to try and make sense of it all, but he had higher priorities at the moment. The first was how to get out of his current situation of being naked in a tree with snow falling all around and no way for him to get down.', 'https://purr.objects-us-east-1.dream.io/i/img_27941.jpg', '0'), 
('Assunta', 'This is important to remember.', 'This is important to remember. Love isnt like pie. You dont need to divide it among all your friends and loved ones. No matter how much love you give, you can always give more. It doesnt run out, so dont try to hold back giving it as if it may one day run out. Give it freely and as much as you want.', 'https://purr.objects-us-east-1.dream.io/i/nougat.jpeg', '0'), 
('Luciano', 'One can cook on and with an open fire.', 'One can cook on and with an open fire. These are some of the ways to cook with fire outside. Cooking meat using a spit is a great way to evenly cook meat. In order to keep meat from burning, its best to slowly rotate it.', 'https://purr.objects-us-east-1.dream.io/i/49SEH.jpg', '0'), 
('Tiara', 'There are different types of secrets.', 'There are different types of secrets. She had held onto plenty of them during her life, but this one was different. She found herself holding onto the worst type. It was the type of secret that could gnaw away at your insides if you didnt tell someone about it, but it could end up getting you killed if you did.', 'https://purr.objects-us-east-1.dream.io/i/unnamed.jpg', '0'), 
('Terry', 'They rushed out the door.', 'They rushed out the door, grabbing anything and everything they could think of they might need. There was no time to double-check to make sure they werent leaving something important behind. Everything was thrown into the car and they sped off. Thirty minutes later they were safe and that was when it dawned on them that they had forgotten the most important thing of all.', 'https://purr.objects-us-east-1.dream.io/i/leave-me-alone-cat.gif', '0'), 
('Edwina', 'It wasnt quite yet time to panic.', 'It wasnt quite yet time to panic. There was still time to salvage the situation. At least that is what she was telling himself. The reality was that it was time to panic and there wasnt time to salvage the situation, but he continued to delude himself into believing there was.', 'https://purr.objects-us-east-1.dream.io/i/6TEOZ.jpg', '0'), 
('Griffin', 'She was aware that things could go wrong.', 'She was aware that things could go wrong. In fact, she had trained her entire life in anticipation that things would go wrong one day. She had quiet confidence as she started to see that this was the day that all her training would be worthwhile and useful. At this point, she had no idea just how wrong everything would go that day.', 'https://purr.objects-us-east-1.dream.io/i/Bh0nZ.jpg', '0'), 
('Reginald', 'She wanted rainbow hair.', 'She wanted rainbow hair. Thats what she told the hairdresser. It should be deep rainbow colors, too. She wasnt interested in pastel rainbow hair. She wanted it deep and vibrant so there was no doubt that she had done this on purpose.', 'https://purr.objects-us-east-1.dream.io/i/10624755_823354494388725_2539116401027301765_n.jpg', '0'), 
('Terry', 'The paper was blank.', 'The paper was blank. It shouldnt have been. There should have been writing on the paper, at least a paragraph if not more. The fact that the writing wasnt there was frustrating. Actually, it was even more than frustrating. It was downright distressing.', 'https://purr.objects-us-east-1.dream.io/i/img_5636.jpg', '0'), 
('Jeanne', 'The trees, therefore, must be such old', 'The trees, therefore, must be such old and primitive techniques that they thought nothing of them, deeming them so inconsequential that even savages like us would know of them and not be suspicious. At that, they probably didnt have too much time after they detected us orbiting and intending to land. And if that were true, there could be only one place where their civilization was hidden.', 'https://purr.objects-us-east-1.dream.io/i/Eu8F6.jpg', '0'), 
('Luciano', 'There was only one way to do things in the Statton house.', 'There was only one way to do things in the Statton house. That one way was to do exactly what the father, Charlie, demanded. He made the decisions and everyone else followed without question. That was until today.', 'https://purr.objects-us-east-1.dream.io/i/hDqGo.jpg', '0'), 
('Mavis', 'She was in a hurry.', 'She was in a hurry. Not the standard hurry when youre in a rush to get someplace, but a frantic hurry. The type of hurry where a few seconds could mean life or death. She raced down the road ignoring speed limits and weaving between cars. She was only a few minutes away when traffic came to a dead standstill on the road ahead.', 'https://purr.objects-us-east-1.dream.io/i/WgV0q.png', '0'), 
('Kody', 'She had a terrible habit o comparing her life to others', 'She had a terrible habit o comparing her life to others. She realized that their life experiences were completely different than her own and that she saw only what they wanted her to see, but that didnt matter. She still compared herself and yearned for what she thought they had and she didnt.', 'https://purr.objects-us-east-1.dream.io/i/20170130_121954.jpg', '0'), 
('Justus', 'The rain and wind abruptly stopped.', 'The rain and wind abruptly stopped, but the sky still had the gray swirls of storms in the distance. Dave knew this feeling all too well. The calm before the storm. He only had a limited amount of time before all Hell broke loose, but he stopped to admire the calmness. Maybe it would be different this time, he thought, with the knowledge deep within that it wouldnt.', 'https://purr.objects-us-east-1.dream.io/i/qdGID.jpg', '0'), 
('Thaddeus', 'He couldnt remember exactly where he had read it', 'He couldnt remember exactly where he had read it, but he was sure that he had. The fact that she didnt believe him was quite frustrating as he began to search the Internet to find the article. It wasnt as if it was something that seemed impossible. Yet she insisted on always seeing the source whenever he stated a fact.', 'https://purr.objects-us-east-1.dream.io/i/0JEgI.jpg', '0'), 
('Delfina', 'He wandered down the stairs and into the basement', 'He wandered down the stairs and into the basement. The damp, musty smell of unuse hung in the air. A single, small window let in a glimmer of light, but this simply made the shadows in the basement deeper. He inhaled deeply and looked around at a mess that had been accumulating for over 25 years. He was positive that this was the place he wanted to live.', 'https://purr.objects-us-east-1.dream.io/i/photo.jpg', '0'), 
('Maurine', 'She has seen this scene before.', 'She has seen this scene before. It had come to her in dreams many times before. She had to pinch herself to make sure it wasnt a dream again. As her fingers squeezed against her arm, she felt the pain. It was this pain that immediately woke her up.', 'https://purr.objects-us-east-1.dream.io/i/6943006763_f46bb343fc_z.jpg', '0'), 
('Sheldon', 'Its an unfortunate reality that we dont teach people how to make money', 'Its an unfortunate reality that we dont teach people how to make money (beyond getting a 9 to 5 job) as part of our education system. The truth is there are a lot of different, legitimate ways to make money. That doesnt mean they are easy and that you wont have to work hard to succeed, but it does mean that if youre willing to open your mind a bit you dont have to be stuck in an office from 9 to 5 for the next fifty years o your life.', 'https://purr.objects-us-east-1.dream.io/i/20161108_141410.jpg', '0'), 
('Darien', 'The robot clicked disapprovingly.', 'The robot clicked disapprovingly, gurgled briefly inside its cubical interior and extruded a pony glass of brownish liquid. "Sir, you will undoubtedly end up in a drunkards grave, dead of hepatic cirrhosis," it informed me virtuously as it returned my ID card. I glared as I pushed the glass across the table.', 'https://purr.objects-us-east-1.dream.io/i/boots.jpg', '0'), 
('Piper', 'It went through such rapid contortions', 'It went through such rapid contortions that the little bear was forced to change his hold on it so many times he became confused in the darkness, and could not, for the life of him, tell whether he held the sheep right side up, or upside down. But that point was decided for him a moment later by the animal itself, who, with a sudden twist, jabbed its horns so hard into his lowest ribs that he gave a grunt of anger and disgust.', 'https://purr.objects-us-east-1.dream.io/i/071_-_FHR9Qbk.gif', '0'), 
('Piper', 'She patiently waited for his number to be called.', 'She patiently waited for his number to be called. She had no desire to be there, but her mom had insisted that she go. Shes resisted at first, but over time she realized it was simply easier to appease her and go. Mom tended to be that way. She would keep insisting until you wore down and did what she wanted. So, here she sat, patiently waiting for her number to be called.', 'https://purr.objects-us-east-1.dream.io/i/060_-_tBzSqUc.gif', '0'), 
('Bradford', 'Ten more steps.', 'If he could take ten more steps it would be over, but his legs wouldnt move. He tried to will them to work, but they wouldnt listen to his brain. Ten more steps and it would be over but it didnt appear he would be able to do it.', 'https://purr.objects-us-east-1.dream.io/i/img_5636.jpg', '0'), 
('Tressa', 'He had three simple rules by which he lived.', 'He had three simple rules by which he lived. The first was to never eat blue food. There was nothing in nature that was edible that was blue. People often asked about blueberries, but everyone knows those are actually purple. He understood it was one of the stranger rules to live by, but it had served him well thus far in the 50+ years of his life.', 'https://purr.objects-us-east-1.dream.io/i/fNf4qJZ.jpg', '0'), 
('Thaddeus', 'The chair sat in the corner where it had been', 'The chair sat in the corner where it had been for over 25 years. The only difference was there was someone actually sitting in it. How long had it been since someone had done that? Ten years or more he imagined. Yet there was no denying the presence in the chair now.', 'https://purr.objects-us-east-1.dream.io/i/t3nMb.jpg', '0'), 
('Sheldon', 'Things arent going well at all', 'Things arent going well at all with mom today. She is just a limp noodle and wants to sleep all the time. I sure hope that things get better soon.', 'https://purr.objects-us-east-1.dream.io/i/PFYWm.jpg', '0');

-- insert dummy reply data
INSERT INTO replies (username, content, imageURL, user_id, message_id) VALUES
('eburras1q', 'This is some awesome thinking!', 'https://images.dog.ceo/breeds/greyhound-italian/n02091032_722.jpg', '0', '1'), 
('omarsland1y', 'What terrific math skills you’re showing!', 'https://images.dog.ceo/breeds/beagle/n02088364_10575.jpg', '0', '2'), 
('jissetts', 'You are an amazing writer!', 'https://images.dog.ceo/breeds/dachshund/dachshund_4.jpg', '0', '2'), 
('bleveragei', 'Wow! You have improved so much!', 'https://images.dog.ceo/breeds/terrier-yorkshire/n02094433_5500.jpg', '0', '4'), 
('cmasurel1x', 'Nice idea!', 'https://images.dog.ceo/breeds/terrier-yorkshire/n02094433_7394.jpg', '0', '5'), 
('cdavydochkin2o', 'You are showing excellent understanding!', 'https://images.dog.ceo/breeds/whippet/n02091134_16109.jpg', '0', '5'), 
('froachel', 'This is clear, concise, and complete!', 'https://images.dog.ceo/breeds/affenpinscher/n02110627_641.jpg', '0', '7'), 
('kogilvy29', 'What a powerful argument!', 'https://images.dog.ceo/breeds/terrier-russell/iguet2.jpeg', '0', '8'), 
('smargiottau', 'I knew you could do it!', 'https://images.dog.ceo/breeds/spaniel-sussex/n02102480_2875.jpg', '0', '8'), 
('mbrooksbanky', 'Wonderful ideas!', 'https://images.dog.ceo/breeds/malinois/n02105162_7213.jpg', '0', '9'), 
('rstrettle1v', 'It was a pleasure to grade this!', 'https://images.dog.ceo/breeds/samoyed/n02111889_5680.jpg', '0', '9'), 
('rkingswood24', 'Keep up the incredible work!', 'https://images.dog.ceo/breeds/affenpinscher/n02110627_3841.jpg', '0', '10'), 
('xisherwoodr', 'My goodness, how impressive!', '', '0', '11'), 
('bpickering1k', 'You’re showing inventive ideas!', 'https://images.dog.ceo/breeds/african/n02116738_8669.jpg', '0', '12'), 
('cgaber23', 'You’ve shown so much growth!', 'https://images.dog.ceo/breeds/keeshond/n02112350_7368.jpg', '0', '13'), 
('pcumbes2r', 'Interesting thoughts!', '', '0', '14'), 
('nwytchard10', 'I love your neat work!', 'https://images.dog.ceo/breeds/briard/n02105251_8870.jpg', '0', '15'), 
('smargiottau', 'Doesn’t it feel good to do such great work?', '', '0', '15'), 
('dlambarth1n', 'First-rate work!', 'https://images.dog.ceo/breeds/tervuren/maverick.JPG', '0', '16'), 
('vcholdcroftg', 'This is fascinating information!', 'https://images.dog.ceo/breeds/pointer-germanlonghair/hans2.jpg', '0', '16'), 
('kmeus4', 'You inspire me!', 'https://images.dog.ceo/breeds/waterdog-spanish/20181023_072736.jpg', '0', '17'), 
('smargiottau', 'This is right on target!', 'https://images.dog.ceo/breeds/kuvasz/n02104029_4791.jpg', '0', '18'), 
('mturleyd', 'What an astounding observation!', 'https://images.dog.ceo/breeds/spaniel-sussex/n02102480_2224.jpg', '0', '19'), 
('dpierrof', 'This is very well thought out!', 'https://images.dog.ceo/breeds/komondor/n02105505_4436.jpg', '0', '21'), 
('dbuist25', 'I can tell you’ve been practicing!', '', '0', '22'), 
('kogilvy29', 'You’ve come a long way!', 'https://images.dog.ceo/breeds/havanese/00100trPORTRAIT_00100_BURST20191112123933390_COVER.jpg', '0', '24'), 
('ahinckes21', 'I can tell you’ve been paying attention!', 'https://images.dog.ceo/breeds/eskimo/n02109961_8977.jpg', '0', '25'), 
('kpondjones2c', 'Reading this made my day!', 'https://images.dog.ceo/breeds/elkhound-norwegian/n02091467_488.jpg', '0', '25'), 
('kdulyt', 'This is very perceptive!', 'https://images.dog.ceo/breeds/spaniel-cocker/n02102318_11615.jpg', '0', '26'), 
('dalmondz', 'What an accomplishment!', 'https://images.dog.ceo/breeds/shihtzu/n02086240_533.jpg', '0', '26'), 
('dduggan2k', 'You make a great point here!', 'https://images.dog.ceo/breeds/dhole/n02115913_3918.jpg', '0', '27'), 
('lgherardi12', 'I really like your creativity!', 'https://images.dog.ceo/breeds/bouvier/n02106382_2922.jpg', '0', '29'), 
('cdavydochkin2o', 'You are an exceptional student!', 'https://images.dog.ceo/breeds/dhole/n02115913_520.jpg', '0', '29'), 
('pcumbes2r', 'You have brilliant thoughts!', 'https://images.dog.ceo/breeds/mastiff-bull/n02108422_5234.jpg', '0', '30'), 
('brickeardn', 'This is beautiful!', '', '0', '30');

/* output from SELECT * FROM pg_catalog.pg_tables WHERE tableowner = 'gchan';
 schemaname |  tablename   |   tableowner   | tablespace | hasindexes | hasrules | hastriggers | rowsecurity
------------+--------------+----------------+------------+------------+----------+-------------+-------------
 public     | ip_logs      |      gchan     |            | f          | f        | f           | f
 public     | users        |      gchan     |            | f          | f        | f           | f
 public     | post_logs    |      gchan     |            | t          | f        | f           | f
 public     | marquees     |      gchan     |            | t          | f        | f           | f
 public     | placeholders |      gchan     |            | t          | f        | f           | f
 public     | replies      |      gchan     |            | f          | f        | t           | f
 public     | messages     |      gchan     |            | t          | f        | t           | f
 */
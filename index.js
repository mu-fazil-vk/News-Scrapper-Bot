const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const qrcode = require('qrcode-terminal');
var ffmpeg = require('fluent-ffmpeg');
const { Client } = require('whatsapp-web.js');
const express = require('express')
var qr = require('qr-image');  
const { config } = require('process');
const app = express()
const configs = require("./config");
const { MessageMedia } = require('whatsapp-web.js');


let sessionData;
var sampleID = '{"not":"change"}';

const SESSION_FILE_PATH = './session.json';

const url = 'https://www.manoramaonline.com/';

var grps = configs.wa_grp_id.split(',');

var Full_News = '';
Heading = '';
var ImgLink = '';

var client;
if(configs.session == sampleID){
	client = new Client({
	    session: sessionData, // || sessionID,
	    puppeteer: { headless: true, args: ['--no-sandbox'], },
	    ffmpegPath: require('@ffmpeg-installer/ffmpeg').path,
	    //if you are using YOUR OWN SYSTEM, please change the PATH below and uncommand
	    //executablePath: "YOUR\CHROME\PATH",
	    //ffmpegPath: 'YOUR\FFMPEG\PATH',
	  });
	}
	else{
		client = new Client({
			session: sessionData || configs.session,
			puppeteer: { headless: true, args: ['--no-sandbox'], },
			ffmpegPath: require('@ffmpeg-installer/ffmpeg').path,
			//if you are using YOUR OWN SYSTEM, please change the PATH below and uncommand
			//executablePath: "YOUR\CHROME\PATH",
			//ffmpegPath: 'YOUR\FFMPEG\PATH',
		});
	}

app.get('/', (req, res) => {
	var final_session;

  	if (fs.existsSync(SESSION_FILE_PATH)) {
  	  sessionData = require(SESSION_FILE_PATH);
  	}
	else{
		console.log(`Click Open App or Go here: http://${configs.app_name}.herokuapp.com/  \nAnd scan QR code on your WhatsApp web\nIf you already done this, then ignore it.`)
		client.on('qr', qrCode => {
			console.log(`Click Open App or Go here: http://${configs.app_name}.herokuapp.com/  \nAnd scan QR code on your WhatsApp web.\nIf you already done this, then ignore it.`)
			var code = qr.image(qrCode, { type: 'svg' });
  			res.type('svg');
  			code.pipe(res);

		    qrcode.generate(qrCode, {small: true});
		});

		client.on('authenticated', (session) => {
		    sessionData = session;
		    console.log(JSON.stringify(session));
			final_session = JSON.stringify(session);
			fs.writeFile('session.json', final_session, 'utf8', function (){console.log("Json Created")});
		});

		client.on("auth_failure", () => {
			console.error(
			  "There is a problem in authentication, please delete session.json file and try again."
			);
		  });

		client.on('ready', () => {
		    console.log('Client is ready!');
		    let info = client.info;
		    let num = info['me']['user']+'@s.whatsapp.net';
		    client.sendMessage(num, "*Bot Started*");
			client.sendMessage(num, final_session);
			client.sendMessage(num, "*Copy Above code and past it in heroku SESSION field*");
		});
}
	
})
console.log(`Click Open App or Go here: http://${configs.app_name}.herokuapp.com/  \nAnd scan QR code on your WhatsApp web\nIf you already done this, then ignore it.`)

client.initialize();

client.on('message', async message => {
	console.log(message.from);
	await sleep(10000);
	await scrapNews('https://www.manoramaonline.com/');
	if (Full_News != '') {
		var finalImage = ImgLink;
		var finalNews = Full_News;
		const mediaNews = await MessageMedia.fromUrl(finalImage);
		for(var i=0;i<grps.length;i++){
        	await client.sendMessage(grps[i], mediaNews, {caption: finalNews})
		}
		//await client.sendMessage(configs.wa_grp_id, Full_News);
		Full_News = '';
		ImgLink = '';
	}
  });



  async function scrapNews(url){
	var newsHead;
	var newsBody;
	var pageLink;
	var newsImage;
	axios(url).then(async response => {
		const html = response.data;
		const $ = cheerio.load(html);
		var newses = [];
		var imgs = [];
		$('.image-block', html).each(function() {
			imglink = $(this).find('a').find('img').attr('data-src-mobile');

			imgs.push({
				imglink: imglink
			});
		});
		$('.content-ml-001', html).each(function() {
			heading = $(this).find('a').attr('title');
			short = $(this).text();
			link = $(this).find('a').attr('href');

			newses.push({
				heading: heading,
				short: short,
				link: link
			});
		});
		newsHead = await newses[0].heading.trimStart();
		newsBody = await newses[0].short.trimStart();
		pageLink = await newses[0].link;
		newsImage = await imgs[0].imglink;

		if(Heading == newsHead){
			console.log('No new news');
			Full_News = '';
			ImgLink = '';
		}
		else{
			FullNews = `*${newsHead}* \n\n_${configs.wa_grp}_\n\n_${newsBody}_ \n_Read More:_\n_${pageLink}_`;
			ImgLink = newsImage;
			Heading = newsHead;
			Full_News = FullNews;
		}
	});
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}



app.get('/news-api', (req, res) => {
	axios(url).then(response => {
		const html = response.data;
		const $ = cheerio.load(html);
		var newses = [];
		$('.content-ml-001', html).each(function() {
			heading = $(this).find('a').attr('title');
			short = $(this).text().trimStart();
			link = $(this).find('a').attr('href');

			newses.push({
				heading: heading,
				short: short,
				link: link
			});
		});
		console.log(newses[0]);
		var fNewses = [];
		for(var i = 0; i < 5; i++) {
			fNewses.push({
				heading: newses[i].heading,
				short: newses[i].short,
				link: newses[i].link
			});
		}
		res.json(fNewses);
		
	});
	
})
console.log(`Server News API: http://${configs.app_name}.herokuapp.com/news-api`)

app.get('/news', (req, res) => {
	res.sendFile('index.html', { root: '.' });
})
app.listen(process.env.PORT || 5000, () => {console.log(`Server Running Port: http://${configs.app_name}.herokuapp.com/`)})
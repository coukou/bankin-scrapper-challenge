const debug = require('debug')('bankin:scrapper');
const puppeteer = require('puppeteer');

const Scrapper = require('./scrapper');

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const s = new Scrapper(page);
	await s.scrap();
	await browser.close();
})();

const debug = require('debug')('bankin:scrapper');
const puppeteer = require('puppeteer');

const Scrapper = require('./scrapper');
const cluster = require('cluster');

if (cluster.isMaster) {
	let i = 0;
	const numCPUs = require('os').cpus().length;
	let transactions = [];
	let running = 0;
	let ended = false;

	cluster.on('message', (worker, msg) => {
		if (msg.transactions) {
			running--;
			if (msg.transactions.length > 0)
				transactions = transactions.concat(msg.transactions);
			else {
				ended = true;
			}

		}
		if (msg.next) {
			if (ended) {
				if (running === 0) {
					for (const id in cluster.workers) {
						cluster.workers[id].send({exit: true});
					}
					console.log('transactions count:', transactions.length)
				}
			}
			else {
				running++;
				worker.send({next: i++});
			}
		}
	})

	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

} else {
	(async () => {
		const browser = await puppeteer.launch();
		process.on('message', async (msg) => {
			if (msg.exit) {
				await browser.close();
				process.exit();
			}
			if (msg.next !== undefined) {
				new Scrapper(browser).scrap(msg.next * 50).then(async (transactions) => {
					process.send({transactions, next: true});
				});
			}
		})
		for (var i = 0; i < 20; i++)
			process.send({next: true});
	})();
}

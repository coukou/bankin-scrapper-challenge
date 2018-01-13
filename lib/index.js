const cluster = require('cluster');
const debug = require('debug')('bankin:scrapper');
const puppeteer = require('puppeteer');

const Scrapper = require('./scrapper');


function getArgumentValue(name, bool = false) {
	const index = process.argv.findIndex((v) => v === (name));
	if (index < 0)
		return (bool ? false : undefined);
	const value = process.argv[index + 1];
	if (value === undefined)
		return (bool);
	if (value !== undefined && !value.startsWith('-'))
		return (value);
}

if (cluster.isMaster) {
	let i = 0;
	let transactions = [];
	let running = 0;
	let ended = false;

	const max = parseInt(getArgumentValue('-m') || getArgumentValue('--max') || 0);
	const start = parseInt(getArgumentValue('-s') || getArgumentValue('--start') || 0);
	const thread = parseInt(getArgumentValue('-t') || getArgumentValue('--thread') || 1);
	if ((getArgumentValue('-d', true) || getArgumentValue('--debug', true)))
		process.env['DEBUG'] = 'bankin:*';

	i = parseInt(start > 0 ? start - 1 : 0);

	cluster.on('message', (worker, msg) => {
		if (msg.transactions) {
			running--;
			if (msg.transactions.length > 0)
				transactions = transactions.concat(msg.transactions);
			else
				ended = true;
		}
		if (msg.next) {
			if (ended || (max > 0 && (i > max + start))) {
				if (running === 0) {
					for (const id in cluster.workers) {
						cluster.workers[id].send({exit: true});
					}
					transactions = transactions.sort((t1, t2) => {
						let a = parseInt(t1.Transaction.match(/(\d+)/)[0]);
						let b = parseInt(t2.Transaction.match(/(\d+)/)[0]);
						return (a - b);
					});
					if (max > 0)
						transactions = transactions.slice(0, max);
					process.stdout.write(JSON.stringify(transactions) + '\n');
				}
			}
			else {
				running++;
				worker.send({next: i});
				i += 50;
			}
		}
	})

	for (let i = 0; i < thread; i++) {
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
				new Scrapper(browser).scrap(msg.next).then(async (transactions) => {
					process.send({transactions, next: true});
				});
			}
		})
		for (var i = 0; i < 1; i++)
			process.send({next: true});
	})();
}

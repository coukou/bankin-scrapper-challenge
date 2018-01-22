/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   BankinScrapper.js                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/21 17:57:52 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/22 03:17:54 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const fs = require('fs');
const puppeteer = require('puppeteer');
const Scrapper = require('./Scrapper');

const { filenameGenerator } = require('./utils')

class BankinScrapper {

	constructor(opts) {
		this.opts = opts;
		this.opts.transactionsPerPage = 50;
		this.start = opts.range[0] - 1;
		this.ended = false;
		this.transactions = [];
		this.browsers = [];
		this.scrappers = [];
	}

	/**
	 * Fonction qui tri les transactions en comparant le nombre a la fin
	 * de la case "Transaction"
	 */
	sortTransactions() {
		this.transactions = this.transactions.sort((t1, t2) => {
			let a = parseInt(t1.Transaction.match(/(-?\d+)/)[0]);
			let b = parseInt(t2.Transaction.match(/(-?\d+)/)[0]);
			return (a - b);
		});
	}

	/**
	 * On affiche les transactions soit dans la console, soit dans un fichier
	 * suivant les options
	 */
	outputTransactions() {
		const data = JSON.stringify(this.transactions);
		if (this.opts.output === undefined)
			return process.stdout.write(data + '\n');
		const filename = filenameGenerator(this.opts.output, {
			start: this.opts.range[0],
			end: this.opts.range[0] + this.transactions.length - 1,
			length: this.transactions.length
		})
		fs.writeFileSync(filename, data);
	}

	/**
	 * Fonction qui renvois vrai si toutes nos instances
	 * de scrapping ont était fermer
	 */
	allScrappersClosed() {
		return this.scrappers.findIndex((s) => s.closed === false) < 0;
	}

	/**
	 * Fonction qui ferme tout les scrapper lancer avec un "start" dépassant
	 * le nombre maxium de transactions
	 * @param {number} start
	 */
	closeUselessScrappers(start) {
		this.scrappers.forEach((s) => {
			if (s.start > start)
				s.close();
		});
	}

	/**
	 * Fonction appeler lorsque un scrapper est fermer
	 * @param {Scrapper} scrapper
	 */
	onScrapperClosed(scrapper) {
		if (!this.ended) {
			this.ended = true;
			this.closeUselessScrappers(scrapper.start);
		}
		if (this.allScrappersClosed())
			this.close();
	}

	/**
	 * Fonction appeler lorsqu'on reçoi le résultat d'un scrapper
	 * @param {Scrapper} scrapper
	 * @param {{Account: string, Transaction: string, Amount: number, Currency: string}[]} result
	 */
	onScrapperResult(scrapper, result) {
		// si le résultat depasse la plage de transactions passer en options
		// alors on garde que les transactions ne dépassant pas la fin
		// de notre plage
		if (scrapper.start + result.length > this.opts.range[1])
			result = result.slice(0, this.opts.range[1] - scrapper.start)
		this.transactions = this.transactions.concat(result);
		if (this.ended)
			return scrapper.close();
		this.startScrapper(scrapper);
	}

	/**
	 * Initiliase toutes les instances de navigateur
	 * @param {number} n le nombre de navigateur à ouvrir
	 */
	async initBrowsers(n) {
		for (let i = 0; i < n; i++) {
			const browser = await puppeteer.launch({headless: true});
			this.browsers.push(browser);
		}
	}

	/**
	 * Fonction qui initialise toutes les instances de scrapper par navigateur
	 * @param {number} n le nombre de scrappers par navigateur
	 */
	async initScrappers(n) {
		const { transactionsPerPage } = this.opts;
		while (this.scrappers.length < n * this.browsers.length) {
			for (const browser of this.browsers) {
				const scrapper = new Scrapper(browser, { transactionsPerPage });
				scrapper.on('result', this.onScrapperResult.bind(this));
				scrapper.on('closed', this.onScrapperClosed.bind(this));
				await scrapper.init();
				this.scrappers.push(scrapper);
			}
		}
	}

	/**
	 * Fonction qui verifie si notre start depasse par notre
	 * plage de transactions
	 */
	canStartScrapper() {
		if (this.opts.range[1] === undefined)
			return true;
		return (this.start < this.opts.range[1]);
	}

	/**
	 * Demare le scrapper passer en paramètre
	 * et augmente le start de (n) transactions suivant les options
	 * @param {Scrapper} scrapper le scrapper à lancer
	 */
	startScrapper(scrapper) {
		if (!this.canStartScrapper())
			return scrapper.close();
		scrapper.scrap(this.start);
		this.start += this.opts.transactionsPerPage;
	}

	/**
	 * Ferme tout les navigateurs, tri les transactions et affiche
	 * les transactions dans le shell ou dans un fichier
	 */
	async close() {
		this.browsers.forEach(b => b.close());
		this.sortTransactions();
		this.outputTransactions();
	}

	/**
	 * point d'entrée de notre scrapping
	 * on initialise les instances de navigateur / scrapper
	 * puis on lance les scrapper 1 à 1
	 * @param {any} opts les options reçu via les arguments du programme
	 */
	static async start(opts) {
		const instance = new this(opts);
		await instance.initBrowsers(opts.browsers);
		await instance.initScrappers(opts.scrappers);
		instance.scrappers.forEach(s => instance.startScrapper(s));
	}
}

module.exports = BankinScrapper;

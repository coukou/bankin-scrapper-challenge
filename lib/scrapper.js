/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   scrapper.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/11 18:51:29 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/17 16:11:18 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const debug = require('debug');
const cluster = require('cluster');

const config = require('./config');

class Scrapper {

	/**
	 * @param {puppeteer:Browser} browser
	 */
	constructor(browser) {
		this.browser = browser;
		this.page = undefined;
		this.frame = undefined;
		this.start = 0;
	}

	/**
	 * Permet d'afficher un message de debug
	 * @param {string} msg
	 */
	debug (msg) {
		if (!this.__debug)
			this.__debug = debug(`bankin:scrapper:${cluster.worker.id}`);
		this.__debug(`#${this.start} - ${msg}`);
	}

	/**
	 * Cette fonction gere le fait qu'il ce peut que l'affichage du tableau echoue
	 * et affiche une alerte ainsi qu'un boutton qui permet d'afficher le tableau
	 * dans ce cas, on ferme l'alerte et on appuie sur le boutton
	 * @param {puppeteer:Dialog} dialog
	 */
	async handleRenderingError(dialog) {
		this.debug('transactions rendering error');
		this.debug('closing alert');
		await dialog.accept();
		this.debug('clicking on "Reload Transactions" button');
		await this.page.click('#btnGenerate');
	}

	/**
	 * Cette fonction gere le fait qu'il ce peut que l'affichage du tableau soit
	 * fait dans une iframe frame)
	 * dans ce cas on garde en memoire l'iframe
	 * @param {puppeteer:Frame} frame
	 */
	async handleTransactionsInFrame(frame) {
		this.debug('transaction table rendering in new frame');
		this.frame = frame;
	}

	/**
	 * parse le tableau et extrait :
	 * 	- le nom du compte (Account)
	 * 	- le label de la transaction (Transaction)
	 *  - le montant (Amount)
	 *  - la devise (Currency)
	 *
	 * @return {Array<{Account: string, Transaction: string, Amount: number, Currency: string}>} un tableau de transactions
	 */
	async scrapTransactions() {
		this.debug('scrapping transactions...');
		// ici on selection la page ou est stocker notre tableau
		const frame = (this.frame || this.page.mainFrame());

		// ici on commence le scrapping du tableau de transaction
		const transactions = await frame.evaluate(() => {
			// on selectionne le tableau
			const items = document.querySelector('table > tbody').children;
			const data = [];
			let i;
			// on extrer les donnees contenu dans le tableau case par case
			for (i = 1; i < items.length; i++) {
				const item = items.item(i);
				const Account = item.children.item(0).textContent;
				const Transaction = item.children.item(1).textContent;
				// ici on split la case [amount] du tableau par son montant et sa devise
				const [Amount, Currency] = item.children.item(2).textContent.match(/(-?[0-9\.]+)(\D+)/).slice(1);
				// on ajoute les donnees dans notre tableau de transaction
				data.push({
					Account,
					Transaction,
					Amount: parseFloat(Amount),
					Currency
				})
			}
			return (data);
		});
		this.debug(`successfuly scrapped transactions`);
		return (transactions);
	}

	/**
	 * retourne un tableau des transactions trouver sur la page scrapper
	 * le tableau est vide si aucune transactions n'est scrapper
	 * @param {number} start l'index de depart
	 */
	async scrap(start) {
		this.start = start;
		this.debug(`starting scrapping...`);
		// on ouvre une nouvelle page dans l'instance du navigateur
		this.page = await this.browser.newPage();

		this.page.on('dialog', this.handleRenderingError.bind(this));
		this.page.on('frameattached', this.handleTransactionsInFrame.bind(this));

		// on accede a l'url de la page a scrapper
		await this.page.goto(config.url + '?start=' + start);

		// on attend que le tableau soit afficher sur la page
		this.debug('waiting transaction table rendering...');
		await this.page.waitForSelector('table, #fm');

		// on lance le scrapping du tableau
		return await this.scrapTransactions();
	}
}

module.exports = Scrapper;

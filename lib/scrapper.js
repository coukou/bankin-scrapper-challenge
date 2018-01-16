/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   scrapper.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/11 18:51:29 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/16 16:57:51 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const debug = require('debug');
const cluster = require('cluster');

class Scrapper {

	constructor(browser) {
		this.browser = browser;
		this.page = undefined;
		this.frame = undefined;
		this.start = 0;
	}

	debug (msg) {
		if (!this.__debug)
			this.__debug = debug(`bankin:scrapper:${cluster.worker.id}`);
		this.__debug(`#${this.start} - ${msg}`);
	}

	// cette fonction gere le fait que le rendering des transactions
	// peu parfois echouer, et notifier via une alerte
	async handleRenderingError(dialog) {
		this.debug('transactions rendering error');
		// on ferme l'alert
		await dialog.accept();
		this.debug('clicking on "Reload Transactions" button');
		// et on clique sur le bouton qui permet de reload les transactions
		await this.page.click('#btnGenerate');
	}

	// cette fonction gere le fait que le rendering des transactions
	// peu parfois ce faire dans une frame
	async handleTransactionsInFrame(frame) {
		this.debug('transaction table rendering in new frame');
		// on garde en memoire la frame ouverte par le site
		this.frame = frame;
	}

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
				const [Amount, Currency] = item.children.item(2).textContent.match(/([0-9\.]+)(.+)/).slice(1);
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

	async scrap(start) {
		this.start = start;
		this.debug(`starting scrapping...`);
		// on ouvre une nouvelle page dans l'instance du navigateur
		this.page = await this.browser.newPage();

		this.page.on('dialog', this.handleRenderingError.bind(this));
		this.page.on('frameattached', this.handleTransactionsInFrame.bind(this));

		// on accede a l'url de la page a scrapper
		await this.page.goto('https://web.bankin.com/challenge/index.html?start=' + start);

		// on attend que le tableau soit afficher sur la page
		this.debug('waiting transaction table rendering...');
		await this.page.waitForSelector('table, #fm');

		// on lance le scrapping du tableau
		return await this.scrapTransactions();
	}
}

module.exports = Scrapper;

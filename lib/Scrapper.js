/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Scrapper.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/21 16:57:16 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/22 03:16:19 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const { EventEmitter } = require('events');

class Scrapper extends EventEmitter {

	constructor(browser, opts) {
		super();
		this.opts = opts;
		this.browser = browser;
		this.start = undefined;
		this.page = undefined;
		this.frame = undefined;
		this.closed = false;
	}

	/**
	 * Lorsque l'affichage du tableau échoue, une alerte est déclencher
	 * et un boutton "Refresh Transactions" apparait
	 * Cette fonction permet de fermet l'alerte et d'appuyer sur le boutton
	 * pour re-génerer le tableau de transaction
	 * @param {puppeteer.Dialog} dialog
	 */
	async onDialog(dialog) {
		try {
			await dialog.accept();
			await this.page.click('#btnGenerate');
		} catch (err) {}
	}

	/**
	 * Il ce peut que l'affichage du tableau soit fait dans une iframe
	 * Cette fonction permet de garder cette iframe pour scrapper le tableau
	 * @param {puppeteer.Frame} frame
	 */
	onFrameAttached(frame) {
		this.frame = frame;
	}

	/**
	 * Cette fonction évalue notre script de scrapping dans l'instance du navigateur
	 * afin d'extraire les données de transaction du tableau
	 */
	async scrapTransactions() {
		return await this.frame.evaluate(() => {
			// on selectionne le tableau
			const items = document.querySelector('table > tbody').children;
			const data = [];
			let i;
			// on extrer les données contenu dans le tableau case par case
			for (i = 1; i < items.length; i++) {
				const item = items.item(i);
				const Account = item.children.item(0).textContent;
				const Transaction = item.children.item(1).textContent;
				// ici on split la case [amount] du tableau
				// et on extrait son montant et sa devise
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
	}

	/**
	 * Fonction qui nous permet de scrapper le tableau
	 * lorsque la page a fini de charger
	 */
	async onLoad() {
		try {
			// on attend l'affichage du tableau
			await this.page.waitForSelector('table, #fm');
			// on récupére les données du tableau
			const transactions = await this.scrapTransactions();
			// si le tableau n'est pas égale au nombre de transactions par page
			// alors c'est qu'on est arriver à la fin
			if (transactions.length < this.opts.transactionsPerPage)
				this.close();
			if (transactions.length > 0)
				this.emit('result', this, transactions);
		} catch (err) {}
	}

	/**
	 * Fonction qui permet d'initialiser les évenements de notre page
	 * afin de pouvoir gérer tout les cas d'erreurs
	 * et lancer le scrapping lorsque la page est charger
	 */
	async init() {
		this.page = await this.browser.newPage();
		this.page.on('dialog', this.onDialog.bind(this));
		this.page.on('frameattached', this.onFrameAttached.bind(this));
		this.page.on('load', this.onLoad.bind(this));
	}

	/**
	 * Fonction qui ferme notre scrapper et envois un event
	 * comme quoi on a fermer le scrapper
	 */
	async close() {
		this.closed = true;
		this.emit('closed', this);
	}

	/**
	 * Fonction qui lance une nouvelle instance de scrapping
	 * @param {number} start
	 */
	async scrap(start) {
		this.frame = this.page.mainFrame();
		this.start = start;
		this.page.goto('https://web.bankin.com/challenge/index.html?start=' + start);
	}
}

module.exports = Scrapper;

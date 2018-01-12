/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   scrapper.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/11 18:51:29 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/12 10:37:59 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const debug = require('debug');

class Scrapper {

	constructor(page) {
		this.page = page;
		this.frame = undefined;
		this.debug = debug('bankin:scrapper');

		// attaching events
		this.page.on('dialog', this.handleRenderingError.bind(this));
		this.page.on('frameattached', this.handleTransactionsInFrame.bind(this));
	}

	async handleRenderingError(dialog) {
		this.debug('transactions rendering error');
		await dialog.accept();
		this.debug('clicking on "Reload Transactions" button');
		await this.page.click('#btnGenerate');
	}

	async handleTransactionsInFrame(frame) {
		this.debug('transaction table rendering in new frame');
		this.frame = frame;
	}

	async scrapTransactions() {
		const frame = (this.frame || this.page.mainFrame());
		console.log(await frame.evaluate(() => {
			const items = document.querySelector('table > tbody').children;
			const data = [];
			for (let i = 1; i < items.length; i++) {
				const item = items.item(i);
				const account = item.children.item(0).textContent;
				const transaction = item.children.item(1).textContent;
				const amount = item.children.item(2).textContent;
				data.push({
					account,
					transaction,
					amount: parseInt(amount),
					currency: amount[amount.length - 1]
				})
			}
			return JSON.stringify(data);
		}));
	}

	async scrap() {
		await this.page.goto('https://web.bankin.com/challenge/index.html');
		this.debug('waiting transaction table rendering...');
		await this.page.waitForSelector('table, #fm');
		return await this.scrapTransactions();
	}
}

module.exports = Scrapper;

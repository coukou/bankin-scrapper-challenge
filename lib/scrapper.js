/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   scrapper.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/11 18:51:29 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/13 20:01:18 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const debug = require('debug');

class Scrapper {

	constructor(browser) {
		this.browser = browser;
		this.page = undefined;
		this.frame = undefined;
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
		this.debug('scrapping transactions...');
		const frame = (this.frame || this.page.mainFrame());
		const transactions = await frame.evaluate(() => {
			const items = document.querySelector('table > tbody').children;
			const data = [];
			let i;
			for (i = 1; i < items.length; i++) {
				const item = items.item(i);
				const Account = item.children.item(0).textContent;
				const Transaction = item.children.item(1).textContent;
				const [Amount, Currency] = item.children.item(2).textContent.match(/([0-9\.]+)(.+)/).slice(1);
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
		return transactions;
	}

	async scrap(start) {
		this.debug = debug(`bankin:scrapper (start=${start})`);
		this.page = await this.browser.newPage();

		this.page.on('dialog', this.handleRenderingError.bind(this));
		this.page.on('frameattached', this.handleTransactionsInFrame.bind(this));

		await this.page.goto('https://web.bankin.com/challenge/index.html?start=' + start);
		this.debug('waiting transaction table rendering...');
		await this.page.waitForSelector('table, #fm');
		return await this.scrapTransactions();
	}
}

module.exports = Scrapper;

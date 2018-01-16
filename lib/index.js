/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/16 14:28:16 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/16 23:21:33 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const cluster = require('cluster');
const puppeteer = require('puppeteer');

const Scrapper = require('./scrapper');
const { getArgument, showArguments } = require('./utils');

if (getArgument(['-h', '--help'], false)) {
	showArguments();
	process.exit();
}

if (cluster.isMaster) {
	let transactions = [];
	let processing = 0;
	let ended = false;

	// on recupere les arguments
	const max = getArgument(['-m', '--max'], 0);
	const start = getArgument(['-s', '--start'], 0);
	const thread = getArgument(['-t', '--thread'], 1);
	const debug = getArgument(['-d', '--debug'], false);
	const concurency = getArgument(['-c', '--concurency'], 20);

	let i = start - 1;

	if (debug)
		process.env['DEBUG'] = 'bankin:*';

	// on lance toutes les processus enfant de scrapping
	for (let i = 0; i < thread; i++)
		cluster.fork();

	function scrappingStart(worker) {
		// si on a recuperer toutes les transactions
		if (ended || (max > 0 && (i >= max + start))) {
			// si il n'y a plus d'instance en cours de scrapping
			// alors on kill toutes les instances
			if (processing === 0) {
				for (const id in cluster.workers)
					cluster.workers[id].kill();
				// vu qu'on utilise les thread, l'ordre des transaction est aleatoire
				// du coup on les tri
				transactions = transactions.sort((t1, t2) => {
					let a = parseInt(t1.Transaction.match(/(-?\d+)/)[0]);
					let b = parseInt(t2.Transaction.match(/(-?\d+)/)[0]);
					return (a - b);
				});
				// si un argument max est specifie
				// du fait qu'on recupere 50 transactions par tableau
				// on creer une copie contenant seulement le nombre max de transactions
				if (max > 0)
					transactions = transactions.slice(0, max);
				// on affiche les transactions sur la sortie standard
				process.stdout.write(JSON.stringify(transactions) + '\n');
			}
		} else {
			// on augment le nombre d'instance qui scrap
			processing++;
			// on envoie le debut du tableau de transaction
			worker.send({ start: i });
			// vu qu'on recupere 50 transaction par tableau
			// on augmente le nombre de depart par 50
			i += 50;
		}
	}

	// on ecoute les message envoyer par nos processus enfants
	cluster.on('message', (worker, msg) => {
		// lorsqu'un processus enfant est pret
		if (msg === 'ready') {
			// on lance [concurency] instances de scrapping par processus
			for (let i = 0; i < concurency; i++)
				scrappingStart(worker)
		}
		// si le message envoyer par l'instance contient une transaction
		if (msg.transactions) {
			// on met a jour le nombre d'instance en cours de scrapping
			processing--;
			// ici on verifie si notre instance n'est pas tomber sur un tableau
			// comportant 50 entree, si c'est le cas, cela veut dire qu'on est arriver a la fin
			if (msg.transactions.length > 0)
				transactions = transactions.concat(msg.transactions);
			else
				ended = true;
			// on essaie de lancer une nouvelle instance de scrapping sur
			// l'instance qui a fini
			scrappingStart(worker);
		}
	})
} else {
	// si le processus actuel est un processus enfant
	(async () => {
		// on lance une instance chrome
		const browser = await puppeteer.launch();

		// on envoie au maitre qu'on est pret :)
		process.send('ready');

		// ici on handle le signal exit pour couper l'instance chrome
		process.on('exit', async () => {
			await browser.close();
			process.exit();
		})

		process.on('message', async (msg) => {
			// si on recoi la valeur de depart
			if (msg.start !== undefined) {
				// alors on lance une instance de scrappign
				new Scrapper(browser).scrap(msg.start).then(async (transactions) => {
					process.send({ transactions });
				});
			}
		})
	})();
}

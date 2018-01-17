/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/16 14:28:16 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/17 16:14:50 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const fs = require('fs');
const os = require('os');
const cluster = require('cluster');
const puppeteer = require('puppeteer');

const config = require('./config');
const Scrapper = require('./scrapper');
const { getArgument, printUsage, filenameGenerator } = require('./utils');

const maxThread = os.cpus().length;

// si l'argument -h ou --help est specifier
// on affiche l'usage du program et on arrete l'execution
if (getArgument(['-h', '--help'], false)) {
	printUsage();
	process.exit();
}

if (cluster.isMaster) {
	let transactions = [];
	let scrappers = 0;
	let ended = false;

	// on recupere les arguments
	const max = getArgument(['-m', '--max'], config.max);
	const _start = getArgument(['-s', '--start'], config.start) - 1;
	const debug = getArgument(['-d', '--debug'], config.debug);
	const concurency = getArgument(['-c', '--concurency'], config.concurency);
	const output = getArgument(['-o', '--out'], config.output);
	const thread = Math.min(getArgument(['-t', '--thread'], config.thread), maxThread);

	let start = _start;

	if (debug)
		process.env['DEBUG'] = 'bankin:*';

	// on fork les processus de scrapping
	for (let i = 0; i < thread; i++)
		cluster.fork();

	/**
	 * Envoie la requete a un processus de lancer une instance
	 * de scrapping avec une index de depart donner
	 * @param {Worker} worker
	 */
	function scrappingStart(worker) {
		// on augmente le nombre de scrapper en cours
		scrappers++;
		// on demande a notre processus enfant de lancer une instance
		// en lui donnant le point d'entree
		worker.send({ start });
		// vu qu'on recupere 50 transactions par tableau
		// on augmente le nombre de depart par 50
		start += 50;
	}


	/**
	 * kill tout les processus enfant et retourne les transaction
	 * sous le format JSON, sur la sortie standard ou un fichier
	 */
	function scrappingEnd() {
		// on check si il reste des instances en cours d'executions
		if (scrappers !== 0)
			return;

		// on kill tout les processus ouvert
		for (const id in cluster.workers)
			cluster.workers[id].kill();

		// vu qu'on utilise plusieurs processus / scrapper
		// on recois les transactions dans un ordre aleatoire
		// il faut donc les trier !
		transactions = transactions.sort((t1, t2) => {
			let a = parseInt(t1.Transaction.match(/(-?\d+)/)[0]);
			let b = parseInt(t2.Transaction.match(/(-?\d+)/)[0]);
			return (a - b);
		});

		// si un argument max est specifier
		// il nous faut couper notre tableau de façon
		// a avoir seulement les transactions voulus
		if (max > 0)
			transactions = transactions.slice(0, max);

		// si aucun parametre d'output n'est specifie
		if (output === '')
			// on affiche les transactions sur la sortie standard
			return process.stdout.write(JSON.stringify(transactions) + '\n');

		// on genere le nom de fichier par rapport au template passer
		// en argument
		const filename = filenameGenerator(output, {
			length: transactions.length,
			end: _start + transactions.length,
			start: _start + 1
		})

		// on ecrit de le fichier
		fs.writeFileSync(filename, JSON.stringify(transactions) + '\n');
	}

	// on ecoute les message envoyés par nos processus enfants
	cluster.on('message', (worker, msg) => {
		// lorsqu'un processus enfant est prêt
		if (msg === 'ready') {
			// on lance [concurency] instances de scrapping par processus
			// ce qui fait qu'on scrap plusieurs page en même temps sans etre
			// bloquer par les temps d'affichage hasardeu du tableau de transactions
			for (let i = 0; i < concurency; i++) {
				if (max > 0 && (start >= max + _start))
					return;
				scrappingStart(worker)
			}
		}
		// si le message envoyer par le scrapper contient une transaction
		if (msg.transactions) {
			// on met a jour le nombre de scrapper en cours de scrapping
			scrappers--;

			// si on a recu au moins 1 transaction on stock
			if (msg.transactions.length > 0)
				transactions = transactions.concat(msg.transactions);

			// Si jamais on tombe sur un tableau ne contenant pas 50 entrees alors
			// on a scrapper toutes les transactions
			if (msg.transactions.length !== 50)
				ended = true;

			// si on a pas fini de scrapper alors
			// on relance une nouvelle instance
			if (!ended && !(max > 0 && (start >= max + _start)))
				return scrappingStart(worker);

			// si on arrive ici c'est qu'on a fini de scrapper
			return scrappingEnd();
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
			// si on recoi notre point de depart
			if (msg.start !== undefined) {
				// alors on lance un scrapper
				new Scrapper(browser).scrap(msg.start).then(async (transactions) => {
					process.send({ transactions });
				});
			}
		})
	})();
}

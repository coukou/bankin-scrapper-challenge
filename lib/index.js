/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/21 17:34:23 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/22 03:18:55 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const program = require('commander');

function range(v) {
	const values = v.split('..');
	return values.map((v) => {
		return (v !== '' ? Number(v) : undefined);
	})
}

program
	.version(require('../package.json').version)
	.name('yarn start')
	.option('-r, --range <start>..<end>', 'la plage des transactions souhaité (start / end inclus)', range, [ 1 ])
	.option('-s, --scrappers <value>', 'le nombre de "scrapper" par navigateur', 20)
	.option('-b, --browsers <value>', 'le nombre de navigateurs à ouvrir', 1)
	.option('-o, --output <template>', 'le chemin du fichier ou écrire les transactions')
	.parse(process.argv);

require('./BankinScrapper').start(program.opts());

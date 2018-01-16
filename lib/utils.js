/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   utils.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/16 13:01:36 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/16 17:36:32 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

module.exports.getArgument = (names, _default) => {
	const index = process.argv.findIndex((v1) => names.findIndex((v2) => v1.split('=')[0] === v2) >= 0);
	const type = typeof _default;
	if (index < 0) {
		if (type === 'boolean')
			return (false);
		return (_default);
	}
	const value = process.argv[index].split('=')[1];
	if (value === undefined || value.startsWith('-')) {
		if (type === 'boolean')
			return (true);
		return (_default);
	}
	else
	{
		switch (type) {
			case 'boolean':
				return /true|1/.test(value);
			case 'number':
				return Number(value);
			default:
				return (value);
		}
	}
}

module.exports.showArguments = () => {
	process.stdout.write(`usage:
	npm start -- [<args>...]

arguments:
	-h | --help			# affiches les arguments
	-d | --debug=<boolean>		# active les log de debug
	-t | --thread=<number> 		# indique combien de thread doit utiliser le script au max (1 par defaut)
	-m | --max=<number>		# indique le nombre maximum de transaction à scrapper (scrap jusqu'a trouver un tableau qui ne contient pas 50 transactions par defaut)
	-s | --start=<number>		# indique la transaction de depart (0 par defaut)
	-c | --concurency=<number>	# indique le nombre de transaction par thread (10 par defaut)
	` + '\n');
}

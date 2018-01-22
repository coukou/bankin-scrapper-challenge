/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   utils.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: spopieul <spopieul@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2018/01/22 02:30:22 by spopieul          #+#    #+#             */
/*   Updated: 2018/01/22 02:30:24 by spopieul         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */


/**
 * remplace les variables de notre template
 * @param {string} name
 * @param {Array<string>} vars
 */
module.exports.filenameGenerator = (name, vars) => {
	return name.replace(/\#\[(.+?)\]/g, (match, k) => {
		return (vars[k]);
	});
}

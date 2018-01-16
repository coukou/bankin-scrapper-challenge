# bankin-scrapper-challenge


## Comment utiliser

```bash
$ git clone git@github.com:Orenkay/bankin-scrapper-challenge.git
$ cd bankin-scrapper-challenge
$ npm install
$ npm start -- [<args>...]
```

## Les arguments

```
-h | --help			# affiches les arguments
-d | --debug=<boolean>		# active les log de debug
-t | --thread=<number> 		# indique combien de thread doit utiliser le script au max (1 par defaut)
-m | --max=<number>		# indique le nombre maximum de transaction à scrapper (scrap jusqu'a trouver un tableau qui ne contient pas 50 transactions par defaut)
-s | --start=<number>		# indique la transaction de depart (0 par defaut)
-c | --concurency=<number>	# indique le nombre de transaction par thread (10 par defaut)
```

## Structure du JSON

```json
[
	{
		"Account": "Compte",
		"Transaction": "Transaction 1",
		"Amount": 1000,
		"Currency": "€"
	},
	{
		...
	}
]
```

## Autres

pour toutes informations merci de me contacter via : spopieul@student.42.fr

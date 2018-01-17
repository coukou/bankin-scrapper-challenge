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
-s | --start=<number>		# indique la transaction de depart (1 par defaut)
-c | --concurency=<number>	# indique le nombre de scrapper par thread (10 par defaut)
-o | --output=<filename>	# specifie le chemin du fichier de sortie (sortie standard si non specifier)
```

## Filename template

Vous pouvez afficher des variables dans vote nom de fichier avec la syntax suivante : #[variable]

#### variables disponible
``start``: affiche l'index de la premiere transaction
``end``: affiche l'index de la derniere transaction
``length``: affiche le nombre de transactions scrapper

#### exemple
```
node lib/index --output=transactions-#[start]-#[end].json
```
si les transactions vont de 0 à 500
cela donnera un fichier avec le nom : ``transactions-0-500.json``



## Structure du JSON

```json
[
	{
		"Account": "Compte",
		"Transaction": "Transaction 1",
		"Amount": 1337,
		"Currency": "₿"
	},
	{
		...
	}
]
```

## Autres

pour toutes informations merci de me contacter via : spopieul@student.42.fr

# bankin-scrapper-challenge

## pré requis
- ### [__Node__ (LTS)](https://nodejs.org/en/)
- ### [__Yarn__](https://yarnpkg.com/en/docs/install)

## Comment utiliser


```bash
$ git clone git@github.com:Orenkay/bankin-scrapper-challenge.git
$ cd bankin-scrapper-challenge
$ yarn install
$ yarn start [options]
```

## Les arguments

```bash
-V, --version               # output the version number
-r, --range <start>..<end>  # la plage des transactions souhaité (start / end inclus) (default: 1)
-s, --scrappers <value>     # le nombre de "scrapper" par navigateur (default: 20)
-b, --browsers <value>      # le nombre de navigateurs (default: 2)
-o, --output <template>     # le chemin du fichier ou écrire les transactions
-h, --help                  # output usage information
```

## Filename template

Vous pouvez afficher des variables dans vote nom de fichier avec la syntax suivante : #[variable]

#### variables disponible
```bash
start	# affiche l'index de la premiere transaction
end	# affiche l'index de la derniere transaction
length	# affiche le nombre de transactions scrapper
```
#### exemple
la commande suivante
```
yarn start --range=0..500 --output="transactions-#[start]-#[end].json"
```
donnera un fichier avec le nom : ``transactions-0-500.json``



## Structure du JSON

```json
[
	{
		"Account": "Compte",
		"Transaction": "Transaction 1",
		"Amount": 1337,
		"Currency": "Ƀ"
	},
	{
		...
	}
]
```

## Autres

pour toutes informations merci de me contacter via : spopieul@student.42.fr

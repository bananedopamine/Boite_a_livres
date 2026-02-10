# Boite_a_livres
Création d'une boite à livres, chez IES ingénierie à Port - Jerome /seine

---

# Versions : 

- PHP : 8.4

- Symfony : 7.3

- Symfony CLI : 5.16.1 

---

## Lancement du serveur en local avec symfony

Après avoir installer les prérequis :
 - Se rendre dans la racine du projet
 - Ouvrir un invite de commande (cmd)
 - Y écrire cette ligne de commande :
```bash
symfony serve -vv
```
Pour arrêter le serveur, tapper la combinaison de touche "ctrl" + "c".

Pour s'assurer de l'arrêt du serveur local, vous pouvez écrire dans l'invite de commande :
```bash
symfony serve:stop
```

---

## Accès public (sans connexion admin) :
[Page d'accueil du projet](http://localhost:8000/)

    - Entrée d'un livre
        -> création automatique et manuelle si livre non enregistrer
    - Sortie d'un livre
        -> création automatique et manuelle si livre non enregistrer
    - Consultation de la bibliothèque 
        => Les stocks à 0 et les livres désactivés (supprimer) ne sont pas affichés
    - Consultation des informations d'un livre
        -> via bibliothèque
    - Recherche d'un livre spécifique (par ISBN,ou auteur)

---

## Accès admin

Accès par un code pin, écris en brute dans le .env sous la variable :
```.env
PIN_ADMIN=[Code pin à 6 chiffres]
```
[Page de connexion à l'admin](http://127.0.0.1:8000/admin/login) 

---

## Suppression d'un livre dans la base

#### SI ISBN dans la base :
Trouver l'id du livre depuis l'isbn (disponible dans la bibliothèque de l'application):
```bash
php bin/console dbal:run-sql "select id, titre from livre where isbn=[ISBN du livre]"
```

Exemple de résultat : 
```bash
php bin/console dbal:run-sql "select id, titre from livre where isbn=9782266305754" 
 ---- ----------------------------------------------- 
  id   titre                                          
 ---- ----------------------------------------------- 
  21  "La ballade du serpent et de l'oiseau chanteur"  
 ---- -----------------------------------------------
```

#### SI ISBN non présent
Recuperer l'identifiant en regardant avec les autres paramètres du livre <br>
(On enlève la description et lien image car trop long)

```bash
php bin/console dbal:run-sql "select id,isbn, titre, auteur, nb_stock, actif, genre from livre"
```

#### suppression :

Supprimer le livre de la base de données : 
```bash
php bin/console dbal:run-sql "delete from livre where id = [ID du livre]"
```
Puis suppression de tout les mouvements qui sont raccordés au livre :
```bash
php bin/console dbal:run-sql "delete from mouvement where livre_id = [ID du livre]"
```


## Balise perso GitHub

[Projet GitHub](https://github.com/bananedopamine/Boite_a_livres) 

- {Temp:xxxx} / {Closing Temp:xxxx} :

    Ouvrir et fermer un problème temporaire, résolu dans les commit suivant

- {Error:xxx} / {Closing Error:xxxx} :

    Ouverture et fermeture d'une erreur ne faisant pas partie de la ligne de travail actuel mais posant un probème à l'utilisation de l'application

- {Concern:xxxx} / {Answer Concern:xxxx} :

    Ouverture et fermeture d'un questionnement sur les fonctionnalités et/ou la suite du programme 

- {esthétique} :

    Balise concernant uniquement l'affichage d'une page ou l'esthétique général du code.
    Porter sur les commentaires dans le code, le css ou les balises HTML utilisées

- {Switch ...}

    Changement important d'un pan de l'application vers une autre manière d'execution
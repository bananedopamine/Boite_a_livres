# Boite_a_livres
Création d'une boite à livres, chez IES ingénierie à Port - Jerome /seine

---

## Accès public (sans connexion admin) :
    - Entrée d'un livre
    - Sortie d'un livre
    - Consultation de la bibliothèque 
        => Les stocks à 0 ne sont pas affichés
    - Consultation des informations d'un livre
        -> via bibliothèque

---

## Accès admin

Accès par un code pin, écris en brute dans le point env sous la variable :
```.env
PIN_ADMIN=[Code pin à 6 chiffres]
```
[Page de connexion à l'admin](http://127.0.0.1:8000/admin/login) 

---

## Balise perso GitHub

[Projet GitHub](https://github.com/bananedopamine/Boite_a_livres) 

-{Temp:xxxx} / {Closing Temp:xxxx} :

    Ouvrir et fermer un problème temporaire, résolu dans les commit suivant

-{Error:xxx} / {Closing Error:xxxx} :

    Ouverture et fermeture d'une erreur ne faisant pas partie de la ligne de travail actuel mais posant un probème à l'utilisation de l'application

-{Concern:xxxx} / {Answer Concern:xxxx} :

    Ouverture et fermeture d'un questionnement sur les fonctionnalités et/ou la suite du programme 

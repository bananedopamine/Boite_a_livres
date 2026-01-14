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
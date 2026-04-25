# AGENTS.md

## Objectif

Ce document décrit les règles de code et l'architecture du projet `Ml5js_projet`.
Il sert à garantir que les comportements sont implémentés selon les principes

## Règles de base

### 1. `utilisation obligatoire de ml5js` 

- le vaisseau sera guidé par le visage :
- lorsque le visage s'incline à gauche le vaiseau va à gauche, 
- lorsque le visage s'incline à droite le vaisseau va à droite,
- ouvrir la bouche fait monter le vaisseau (il redescend tous seul avec le temps)

### 2. `vehicle.js` 

- La classe `Vehicle` gère la position, la vitesse, l'accélération, `maxSpeed` et `maxForce`.
- On applique les forces avec `applyForce()`.
- `Vehicle` contient des comportements de base : `seek`, `flee`, `arrive`, `wander`, `avoid`, `boundaries`, etc.
- Ne pas modifier `vehicle.js`


### 3. Les entités mobiles doivent être des `Vehicle`

- `asteroid` est un véhicules animés.
- `playership` est un véhicule animé.


## Comportements utilisés dans le projet

- `Wander`: mouvement aléatoire léger en X (variation naturelle)
- `Séparation` : les astéroïdes se repoussent mutuellement pour éviter de se chevaucher
- `Boundaries` : steering de maintien latéral dans la zone de jeu

---

## États et comportements spécifiques

### asteroids

- une descente forcé faire l'ecran du bas pour les rendre plus dangereux

## Visualisation debug

- `Vehicle.debug` active les tracés de zones et de forces.
- on a aussi la détection du visage qui est montré
- Utiliser uniquement pour comprendre et valider les comportements.




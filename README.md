# FacePilot

## Hébergement

Le jeu est hébergé sur GitHub Pages : https://theothebaguette.github.io/ml5js_project/

## Lien vidéo youtube

lien vers la vidéo : https://youtu.be/nX0B8bfz4so

## Lien GitHub du projet réseaux de neuronnes

Lien vers le projet de réseau de neurones associé : https://github.com/TheoTheBaguette/Projet_reseau_de_neurone_Circuit

## Important

Attendre quelques secondes après le chargement de la page pour que la détection faciale se lance correctement. Si la détection ne fonctionne pas, essayez de rafraîchir la page ou de vérifier les permissions de la webcam.

## Résumé du jeu
FacePilot est un jeu d'action où le joueur pilote un vaisseau spatial avec son visage, détecté en temps réel via webcam. L'objectif est de survivre le plus longtemps possible en esquivant des astéroïdes qui descendent vers votre vaisseau.

le but est de survivre le plus longtemps. Le jeu se termine quand on perd 3 vies.

*Contrôles du jeu* :

- **Tête (gauche/droite)** : Tourne ta tête légèrement pour diriger le vaisseau horizontalement. Un petit mouvement suffit 
***Remarque*** : un petit mouvement suffira pas besoin de te tordre le cou sauf si vous voulez aller vite à l'opposé.

- **Bouche ouverte** : Ouvre la bouche pour activer un petit boost vers le haut et esquiver rapidement les astéroïdes.
***Remarque*** : le vaisseau retombera tous seul avec le temps, chaugez bien le boost pour mieux esquiver.
- **Les astéroïdes** : Descendent progressivement et de manière imprévisible. les Toucher fait perdre une vie
- **Reset (bouton)** : Recommence une nouvelle partie ou recommencer après Game Over.
- **Mode debug (bouton ou touche D)** : Active l'overlay facial + debug asteroides (rayon + vecteur vitesse) + infos techniques.
- **Apparition asteroides (slider)** : Regle le taux d'apparition en direct (plus bas/vers la gauche = plus frequent).

Les règles s'affichent à l'écran pour rappeler les contrôles.


## Comportements utilisés dans le projet

- `Wander`: mouvement aléatoire léger en X (variation naturelle)
- `Séparation` : les astéroïdes se repoussent mutuellement pour éviter de se chevaucher
- `Boundaries` : steering de maintien latéral dans la zone de jeu


### Architecture et Comportements

#### Classe PlayerShip
Représente le vaisseau du joueur. Hérite des principes de steering behaviors :

**Contrôle horizontal** :
- Lit la position du **nez** (keypoint[1] du visage)
- Map la position 0.15-0.85 du flux vidéo sur la largeur du vaisseau
- Direction **inversée** : tourne la tête à droite = vaisseau va à gauche (plus intuitif)
- Utilise **arrive-steering** : force réduite au-dessus de targetX, s'arrête à stopRadius

**Contrôle vertical** (boost) :
- Lit le **gap entre les lèvres** (keypoints[13] et [14] du visage)
- Si gap > 15 pixels → boost activé
- Ajoute une force vers le haut (-0.13)

**Physique** :
- Gravité douce (0.045) qui tire le vaisseau vers le bas
- Limites de vitesse séparées en X (max 8) et Y (max 4)
- Limites d'écran avec boundaries

#### Classe Asteroid
Les astéroïdes ennemis qui descendent.
**Comportements** :
- **Wander** : mouvement aléatoire léger en X (variation naturelle)
- **Descente forcée** : force constante vers le bas
- **Séparation** : les astéroïdes se repoussent mutuellement pour éviter de se chevaucher
- **Boundaries** : steering de maintien latéral dans la zone de jeu

**Propriétés** :
- Rayon : 20px
- Vitesse : variable, accélération continuelle
- Spawn : aléatoire en X, au-dessus de l'écran
- Difficulté progressive : intervalle de spawn réduit au fil du temps
- **Taux reglable** : intervalle de base ajustable via slider UI

#### Détection et Dessin
- **startFaceDetection()** : Initialise les modèles ML5
- **updateControls()** : Lit les keypoints et met à jour l'état du vaisseau
- **drawCameraPanel()** : Affiche le flux vidéo en direct
- **Mode debug** : superpose les repères faciaux et enrichit les infos techniques
- **Mode debug (asteroides)** : affiche cercles de collision et vecteurs de vitesse des asteroides
- **drawSideText()** : État des modèles, détections actuelles, infos debug si activé

------------------------
## MON EXPERIENCE

### Pourquoi ce jeu

J'ai choisi ce jeu déjà pour rester dans le thème spatial du réseau de neurones, mais aussi parce que je voulais faire un jeu d'action plus rapide et plus nerveux que les précédents. L'idée de contrôler un vaisseau avec son visage m'a aussi beaucoup plu et aussi c'est plus simple de jouer est testé avec le visage plutot que de faire avec les mains qui peuvent épuiser à force de faire des gestes répétitifs surtout pour tester.


### Difficultés rencontrées et résolutions

Il y a eu tout d'abord plusieurs teste avant de faire ce jeu que cela soit un jeu pour dessiner avec ces mains ou un jeu de plateforme avec des obstacles à éviter, mais je n'arrivais pas à trouver une idée qui me plaisait surtout que cela ne fonctionne pas très bien avec les mains (ce n'était pas très précis) je donc parti sur l'idée de faire un jeu d'action plus rapide et plus nerveux, et de faire le contrôle avec le visage qui est plus précis et plus réactif que les mains et par ailleurs cela m'a donné l'idée de faire un jeu de vaisseau spatial pour rester dans le thème du réseau de neurones.

Ensuite il y a pas mal de soucis avec ma caméra qui avait du mal à détecter , il fallait des fois redémarrer le pc pour que cela fonctionne, et même quand cela fonctionnait il peut arriver qu'au début il ne trouve pas le visage ou que les keypoints soient très instables, du coup j'ai du faire plusieurs ajustements pour rendre la détection plus réactive et plus stable, notamment en combinant les callbacks de ML5 avec un polling manuel pour s'assurer que les données sont à jour, et aussi en ajoutant des fonctions de normalisation des coordonnées pour éviter les problèmes de points en coordonnées mixtes.
Néammoins il pouvait quand même des soucis lors du démarrage alors j'ai mis une indication à l'écran pour dire que la détection fonctionne ou pas, et aussi j'ai ajouté un mode debug pour montrer les keypoints en temps réel et aider à comprendre ce qui se passe et si jamais cela ne marche alors jsute relancer le jeu, ce qui redémarre la détection et souvent cela suffit à régler le problème. (il galère aussi souvent avec les lunettes)

Concernant les mouvements du vaisseau, il y aussi des testes pour le boost qui devait se faire avec la main de base mais était pas très optimal surtout qu'on pouvait potentiellement caché le visage ou juste oublié de descendre notre main correctement pour faire le boost, du coup j'ai décidé de faire le boost avec la bouche qui est plus simple à activer et aussi plus intuitif et donc rester dans le fait d'utiliser que le visage, mais il fallait faire en sorte que cela ne soit pas trop sensible pour éviter les faux positifs (par exemple parler ou juste bouger les lèvres légèrement), donc j'ai choisi un seuil de 15 pixels pour le gap entre les lèvres, ce qui permet d'avoir une activation claire du boost sans être trop sensible.

Il fallait aussi faire en sorte que les mouvements en X et Y n'interfèrent pas, car au début, le boost vertical était affecté par les mouvements horizontaux, ce qui rendait le contrôle du vaisseau très difficile. J'ai donc complètement découplé la physique en X et Y, avec des limites de vitesse séparées et des forces appliquées indépendamment, ce qui a permis d'avoir un mouvement fluide dans les deux dimensions.


### Améliorations possibles

On pourrait ajouter une difficulté progressive :
   - Accélération des astéroïdes au fil du temps
   - Réduction progressive de l'intervalle de spawn (déjà implémenté partiellement)

et aussi du coup ajouter plus de gameplay :
   - Changer le système du temps avec un score , où on gagne des point au fil du temps mais aussi en rammasant des étoiles qui apparaisent aléatoirements dans la zone , pour forcer à prendre des risques
   - Power-ups (bouclier temporaire, ralentissement des astéroïdes)
   - Mode 2-joueurs (deux visages = deux vaisseaux)
   - Autres contrôles, par exemples avec les gestes des mains

Concernant la détection faciale , il y a avait probablement des optimisations à faire pour la rendre plus stable et surtout sans avoir à redémarrer le jeu, mais cela dépend aussi beaucoup de la qualité de la caméra et des conditions d'éclairage, donc je pense que c'est un aspect qui peut être amélioré mais qui est aussi limité par les facteurs externes.


------------------------------------------------------
### IDE et IA utilisés
- **IDE** : Visual Studio Code
- **IA** : GitHub Copilot (modèle Grok Code Fast 1 et GPT 5) pour l'assistance au codage, débogage et génération de code.


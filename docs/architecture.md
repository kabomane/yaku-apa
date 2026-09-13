> Adaptation technique pour Yaku-apa : Node.js 24 et JavaScript ESM.
> Codex orchestre les tâches depuis l'application ; les scripts ne font aucun appel API.
> Les noms de modèles du document source restent indicatifs et ne configurent pas l'application.
> Les exemples narratifs de ce document sont illustratifs, jamais canoniques pour Yaku-apa.
> Les formats exécutables et limites des contrôles sont définis dans formats.md et workflow.md.
> Les boucles d'orchestration ci-dessous sont des descriptions conceptuelles ; aucun moteur autonome n'est installé.
# Architecture d’un système de génération de roman avec Codex + GPT-5.6 Sol

## 1. Objectif du système

Ce projet décrit une architecture permettant d’utiliser **Codex comme orchestrateur** et **GPT-5.6 Sol comme moteur principal de raisonnement et de rédaction** pour produire un roman long, cohérent et révisable.

Le but n’est pas de demander à une IA de générer un manuscrit entier en une seule fois.

Le système doit fonctionner comme une petite chaîne éditoriale automatisée :

1. définir l’univers et les règles du roman ;
2. construire le synopsis et les arcs narratifs ;
3. découper le récit en chapitres ;
4. écrire les chapitres progressivement ;
5. mémoriser les faits importants ;
6. contrôler la continuité ;
7. détecter les incohérences ;
8. réécrire les passages faibles ;
9. effectuer une passe éditoriale globale ;
10. assembler le manuscrit final.

L’objectif principal est de conserver une **vision globale du livre** tout en travaillant localement sur chaque chapitre.

---

# 2. Principe général

Codex ne doit pas être considéré uniquement comme « l’auteur ».

Son rôle principal est celui d’un **orchestrateur de projet**.

Il gère :

- les fichiers ;
- les différentes étapes de production ;
- les agents spécialisés ;
- les dépendances entre les chapitres ;
- la continuité narrative ;
- les audits ;
- les réécritures ;
- l’assemblage du manuscrit final.

GPT-5.6 Sol peut être utilisé comme moteur pour plusieurs rôles différents selon la tâche demandée.

Le même modèle peut donc successivement jouer le rôle :

- d’architecte narratif ;
- d’auteur ;
- d’éditeur ;
- de contrôleur de continuité ;
- de critique ;
- de spécialiste des dialogues ;
- de relecteur stylistique.

L’intérêt est de **séparer les responsabilités** plutôt que de demander à une seule génération de tout faire correctement simultanément.

---

# 3. Architecture du projet

```text
roman/
│
├── AGENTS.md
├── README.md
├── STATUS.md
│
├── bible/
│   ├── univers.md
│   ├── personnages.md
│   ├── lieux.md
│   ├── chronologie.md
│   ├── style.md
│   ├── themes.md
│   └── regles.md
│
├── plan/
│   ├── premise.md
│   ├── synopsis.md
│   ├── arc_global.md
│   ├── arcs_personnages.md
│   └── chapitres.md
│
├── chapters/
│   ├── 01.md
│   ├── 02.md
│   ├── 03.md
│   └── ...
│
├── chapter_notes/
│   ├── 01.md
│   ├── 02.md
│   ├── 03.md
│   └── ...
│
├── summaries/
│   ├── 01.md
│   ├── 02.md
│   ├── 03.md
│   └── ...
│
├── continuity/
│   ├── characters.json
│   ├── relationships.json
│   ├── knowledge.json
│   ├── objects.json
│   ├── locations.json
│   ├── events.json
│   ├── promises.json
│   └── timeline.json
│
├── audits/
│   ├── continuity/
│   ├── style/
│   ├── pacing/
│   ├── dialogue/
│   └── global/
│
├── revisions/
│   ├── requests/
│   ├── completed/
│   └── changelog.md
│
├── scripts/
│   ├── build_manuscript.js
│   ├── validate_continuity.js
│   ├── word_count.js
│   └── project_status.js
│
└── output/
    ├── manuscript.md
    ├── manuscript_draft.md
    └── final_report.md
```

---

# 4. AGENTS.md

`AGENTS.md` est le **contrat général du projet**.

C’est l’un des fichiers les plus importants.

Il définit les règles que Codex doit respecter pendant toute la production.

Il doit contenir au minimum :

## Mission

Exemple :

> Produire et maintenir un roman cohérent, structuré et éditorialement révisé.  
> Aucun chapitre ne doit être considéré comme définitif avant validation de la continuité et de la cohérence narrative.

## Priorités

Ordre recommandé :

1. cohérence du récit ;
2. respect de la psychologie des personnages ;
3. continuité factuelle ;
4. qualité des scènes ;
5. naturel des dialogues ;
6. style ;
7. longueur cible.

La longueur ne doit jamais être obtenue par du remplissage.

## Règles d’écriture

Le fichier définit notamment :

- point de vue ;
- personne grammaticale ;
- temps verbal ;
- niveau de langue ;
- rythme ;
- longueur approximative des chapitres ;
- usage des descriptions ;
- densité des dialogues ;
- degré d’explication autorisé ;
- règles de narration internes au projet.

## Règles de continuité

Avant l’écriture d’un chapitre, l’agent auteur doit consulter :

- le plan du chapitre ;
- la bible ;
- les résumés nécessaires ;
- la timeline ;
- les connaissances des personnages ;
- les relations ;
- les objets importants ;
- les événements non résolus.

Après l’écriture, les données de continuité doivent être mises à jour.

## Règles de modification

Un agent ne doit pas modifier arbitrairement :

- la bible ;
- le passé d’un personnage ;
- une règle fondamentale de l’univers ;
- une révélation future ;
- un événement déjà établi.

Toute modification importante doit être explicitement documentée.

## Règles de réécriture

Une révision locale ne doit pas introduire une contradiction ailleurs.

Toute modification d’un événement important doit déclencher une nouvelle vérification de continuité.

---

# 5. README.md

`README.md` explique le projet à un humain.

Il contient :

- le concept général ;
- le genre ;
- la cible ;
- la longueur visée ;
- la structure du dépôt ;
- la procédure pour lancer ou reprendre la production ;
- les commandes ou scripts utiles ;
- la manière de générer le manuscrit final.

Il ne contient pas les règles détaillées de narration : celles-ci restent dans `AGENTS.md` et dans la bible.

---

# 6. STATUS.md

`STATUS.md` représente l’état courant du projet.

Exemple :

```md
# État du roman

Phase : premier draft

Chapitre actuel : 08

Chapitres écrits : 01 → 07

Chapitres validés :
01
02
03
04
05

En attente d’audit :
06
07

Problèmes ouverts :
- vérifier la chronologie entre les chapitres 04 et 06 ;
- renforcer la motivation de Maya avant le chapitre 09 ;
- résoudre la provenance de la lettre introduite au chapitre 03.

Prochaine tâche :
écrire chapter_notes/08.md puis chapters/08.md.
```

Ce fichier permet à Codex de reprendre le projet sans devoir reconstruire tout l’état mental du processus.

---

# 7. La bible

Le dossier `bible/` contient les éléments relativement stables du roman.

La bible représente la **vérité de référence**.

---

## bible/univers.md

Décrit le fonctionnement général du monde.

Il peut contenir :

- époque ;
- technologie ;
- politique ;
- société ;
- économie ;
- institutions ;
- culture ;
- magie ou systèmes surnaturels ;
- contraintes physiques ;
- règles particulières du monde.

Chaque règle doit être suffisamment précise pour éviter que l’auteur ne l’invente différemment à chaque chapitre.

---

## bible/personnages.md

Fiche canonique des personnages.

Pour chaque personnage :

```md
## Maya Laurent

### Identité

Âge :
Profession :
Origine :
Situation familiale :

### Apparence

...

### Personnalité

...

### Désirs

...

### Peurs

...

### Contradictions internes

...

### Faiblesses

...

### Secrets

...

### Arc prévu

Début :
Milieu :
Fin :

### Manière de parler

...

### Ce que le personnage ignore au début du récit

...
```

Il faut distinguer **ce qui est vrai dans l’univers** de **ce que le personnage sait**.

Cette différence sera ensuite suivie dans `continuity/knowledge.json`.

---

## bible/lieux.md

Référentiel des lieux importants.

Chaque lieu peut préciser :

- localisation ;
- apparence ;
- fonction narrative ;
- personnes présentes habituellement ;
- accès ;
- distances ;
- objets permanents ;
- ambiance ;
- événements qui s’y sont déroulés.

Cela évite notamment qu’une pièce, un bâtiment ou une ville change de configuration sans justification.

---

## bible/chronologie.md

Chronologie générale antérieure au début du livre.

Elle contient :

- événements historiques ;
- enfance des personnages ;
- événements familiaux ;
- rencontres passées ;
- traumatismes ;
- changements politiques ;
- événements nécessaires pour comprendre le récit.

Elle sert surtout à éviter les contradictions de dates et d’âges.

---

## bible/style.md

Décrit la direction stylistique.

Il peut définir :

- longueur moyenne des phrases ;
- niveau de description ;
- degré de lyrisme ;
- ton général ;
- humour ;
- rythme des scènes ;
- façon de traiter les dialogues ;
- vocabulaire à privilégier ou éviter ;
- règles concernant les métaphores ;
- règles concernant la narration intérieure.

Il peut aussi contenir quelques exemples **originaux au projet**, mais ne doit pas demander d’imiter précisément le style d’un auteur vivant.

---

## bible/themes.md

Contient les thèmes principaux et secondaires.

Exemple :

```md
# Thèmes principaux

- identité ;
- transmission ;
- solitude ;
- pouvoir ;
- mémoire.

# Questions centrales

Que devient une personne quand ses souvenirs cessent d’être fiables ?

Peut-on rester moral dans un système construit pour récompenser le contraire ?
```

Les thèmes doivent influencer les choix narratifs sans devenir des slogans répétés dans les dialogues.

---

## bible/regles.md

Contient les contraintes absolues du projet.

Exemple :

```md
# Règles absolues

1. La mémoire ne peut jamais être restaurée intégralement.
2. Maya ne sait pas que Luc est son frère avant la révélation du chapitre 14.
3. Aucun voyage dans le temps.
4. La technologie X nécessite une connexion physique.
5. Aucun personnage ne revient à la vie.
```

Ces règles ont priorité sur une improvisation locale de l’auteur.

---

# 8. Le plan narratif

Le dossier `plan/` représente ce qui doit arriver.

Il est plus flexible que la bible, mais une modification importante doit être consciente et documentée.

---

## plan/premise.md

Contient le concept du roman sous sa forme la plus compacte.

Exemple de structure :

```md
# Prémisse

Une archiviste découvre qu’une partie des souvenirs officiels de sa ville a été artificiellement reconstruite.

# Protagoniste

...

# Objectif

...

# Opposition

...

# Enjeu

...

# Transformation

...
```

---

## plan/synopsis.md

Résumé complet du roman.

Il décrit :

- début ;
- élément déclencheur ;
- montée des conflits ;
- pivot central ;
- crises ;
- climax ;
- résolution.

Il peut faire quelques milliers de mots.

Le synopsis décrit **les événements**, pas encore leur prose définitive.

---

## plan/arc_global.md

Décompose la progression dramatique du livre.

Exemple :

```md
Acte I
Installation / rupture.

Acte II-A
Exploration / premières conséquences.

Point médian
Révélation majeure.

Acte II-B
Escalade / pertes.

Acte III
Confrontation / transformation / résolution.
```

---

## plan/arcs_personnages.md

Décrit l’évolution spécifique de chaque personnage important.

Exemple :

```md
## Maya

État initial :
...

Croyance erronée :
...

Événement qui fragilise cette croyance :
...

Point de rupture :
...

Décision finale :
...

État final :
...
```

Cela permet de détecter les personnages qui traverseraient le roman sans véritable évolution.

---

## plan/chapitres.md

Plan détaillé des chapitres.

Exemple :

```md
# Chapitre 08

Objectif dramatique :
Maya doit obtenir l’accès aux archives fermées.

POV :
Maya

Lieu :
Archives centrales

Début :
...

Conflit :
...

Révélation :
...

Fin :
...

Informations que le lecteur apprend :
...

Informations que Maya apprend :
...

Éléments à préparer pour plus tard :
...

Éléments provenant de chapitres précédents :
...
```

Ce fichier sert de carte de navigation.

Il ne doit pas devenir un texte tellement détaillé qu’il empêche toute créativité lors de l’écriture.

---

# 9. chapter_notes/

Avant chaque chapitre, Codex génère une fiche de travail dédiée.

Exemple :

`chapter_notes/08.md`

```md
# Préparation chapitre 08

## Objectif du chapitre

...

## État émotionnel de Maya au début

...

## Ce que Maya sait

...

## Ce qu’elle ignore

...

## Relations pertinentes

...

## Objets présents

...

## Événements récents à prendre en compte

...

## Promesses narratives ouvertes

...

## Contraintes de continuité

...

## Points obligatoires du plan

...

## Libertés laissées à l’auteur

...
```

Cette étape est importante.

L’agent auteur ne devrait pas avoir à fouiller systématiquement tout le repository pour comprendre ce qu’il doit savoir.

L’orchestrateur prépare donc un **contexte local propre au chapitre**.

---

# 10. chapters/

Le dossier `chapters/` contient le texte littéraire.

Un fichier correspond à un chapitre.

Exemple :

```text
chapters/01.md
chapters/02.md
chapters/03.md
```

Chaque fichier doit contenir uniquement le manuscrit et éventuellement quelques métadonnées très simples.

Exemple :

```md
---
chapter: 8
status: draft
pov: Maya
---

# Chapitre 8

Texte...
```

Les notes d’analyse ne doivent pas polluer ces fichiers.

---

# 11. summaries/

Après chaque chapitre, un résumé fonctionnel est créé.

Il ne s’agit pas d’un résumé littéraire destiné au lecteur.

Il est destiné aux agents.

Exemple :

```md
# Résumé chapitre 08

Maya entre dans les archives grâce au badge de Jonas.

Elle découvre que les dossiers antérieurs à 2041 ont été réécrits.

Jonas lui révèle qu’il connaît l’existence du programme Mnémosyne mais refuse d’expliquer son rôle.

Maya vole le dossier B-17.

À la fin du chapitre, la sécurité découvre l’intrusion.

## Changements importants

- Maya connaît maintenant Mnémosyne.
- Maya possède le dossier B-17.
- Jonas sait que Maya enquête.
- La sécurité recherche l’intrus.
```

Les résumés permettent de rappeler rapidement le passé sans réinjecter en permanence tous les chapitres complets.

---

# 12. continuity/

Le dossier `continuity/` constitue la mémoire structurée du roman.

Il doit contenir des données faciles à vérifier automatiquement.

---

## continuity/characters.json

État courant des personnages.

```json
{
  "maya": {
    "location": "archives_centrales",
    "physical_state": "fatiguee",
    "current_goal": "comprendre_mnemosyne",
    "last_seen_chapter": 8
  }
}
```

---

## continuity/relationships.json

Relations entre personnages.

```json
{
  "maya_jonas": {
    "trust": "faible",
    "relationship": "allies_instables",
    "last_change_chapter": 8,
    "notes": "Jonas a admis connaître Mnémosyne."
  }
}
```

---

## continuity/knowledge.json

Probablement l’un des fichiers les plus importants.

Il décrit **qui sait quoi**.

```json
{
  "mnemosyne_exists": {
    "maya": {
      "knows": true,
      "since_chapter": 8
    },
    "lea": {
      "knows": false
    }
  }
}
```

Cette structure permet d’éviter qu’un personnage utilise une information qu’il n’a jamais apprise.

---

## continuity/objects.json

Suivi des objets narrativement importants.

```json
{
  "dossier_b17": {
    "introduced_chapter": 8,
    "current_owner": "maya",
    "current_location": "sac_maya",
    "known_by": ["maya", "jonas"],
    "status": "intact"
  }
}
```

---

## continuity/locations.json

État dynamique des lieux.

Exemple :

```json
{
  "archives_centrales": {
    "security_level": "alerte",
    "last_event_chapter": 8,
    "accessible_to_maya": false
  }
}
```

---

## continuity/events.json

Historique structuré des événements importants.

```json
{
  "event_008_04": {
    "chapter": 8,
    "type": "discovery",
    "description": "Maya découvre l’existence de Mnémosyne.",
    "participants": ["maya", "jonas"],
    "consequences": [
      "maya_knows_mnemosyne"
    ]
  }
}
```

---

## continuity/promises.json

Suit les promesses narratives ouvertes.

Une promesse narrative peut être :

- une question ;
- un mystère ;
- un danger ;
- un objet ;
- une dette ;
- une menace ;
- une information laissée volontairement incomplète.

Exemple :

```json
{
  "origin_b17": {
    "introduced_chapter": 8,
    "status": "open",
    "expected_resolution": "chapters_12_15",
    "description": "Pourquoi le dossier B-17 contient-il le nom de Maya ?"
  }
}
```

Cela évite d’oublier un élément introduit plusieurs chapitres auparavant.

---

## continuity/timeline.json

Timeline précise du récit.

```json
{
  "day_12": [
    {
      "time": "09:20",
      "chapter": 8,
      "event": "Maya entre dans les archives."
    },
    {
      "time": "10:05",
      "chapter": 8,
      "event": "Découverte du dossier B-17."
    }
  ]
}
```

Elle devient particulièrement utile si le roman contient :

- voyages ;
- enquêtes ;
- délais ;
- plusieurs POV ;
- actions simultanées.

---

# 13. Les agents

Le système peut utiliser plusieurs agents spécialisés.

Il n’est pas obligatoire d’utiliser physiquement un modèle différent pour chaque rôle.

Un même modèle peut être lancé avec des missions différentes.

Architecture logique :

```text
                    ORCHESTRATEUR
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ARCHITECTE          AUTEUR          ÉDITEUR
        │                │                │
        └─────────┬──────┴──────┬─────────┘
                  │             │
            CONTINUITÉ       STYLE
                  │             │
               DIALOGUES     RYTHME
                  │             │
                  └──────┬──────┘
                         │
                    RÉVISEUR FINAL
```

---

# 14. Agent orchestrateur

L’orchestrateur est le chef du processus.

Il ne devrait pas écrire directement chaque passage sauf nécessité.

Il décide :

- quelle tâche doit être exécutée ;
- quels fichiers doivent être lus ;
- quel agent doit intervenir ;
- si un chapitre peut être validé ;
- quelles corrections doivent être effectuées ;
- quand mettre à jour la continuité ;
- quand déclencher un audit global.

Il maintient également `STATUS.md`.

---

# 15. Agent architecte

Intervient principalement avant le premier draft et lors des changements importants.

Responsabilités :

- prémisse ;
- synopsis ;
- arcs ;
- structure ;
- progression des révélations ;
- cohérence thématique ;
- découpage des chapitres.

Il ne devrait pas réécrire spontanément des chapitres déjà validés.

---

# 16. Agent auteur

Écrit le texte littéraire.

Avant de commencer, il reçoit :

- `AGENTS.md` ;
- les règles stylistiques ;
- le plan du chapitre ;
- `chapter_notes/XX.md` ;
- éventuellement les derniers chapitres complets ;
- les résumés nécessaires.

Son rôle est de produire une **scène convaincante**, pas de faire lui-même tout le travail de contrôle.

Il peut prendre des initiatives locales tant qu’elles ne contredisent pas les éléments canoniques.

Toute invention importante doit être capturée après l’écriture dans les fichiers de continuité.

---

# 17. Agent continuité

Son seul objectif est de trouver les contradictions.

Il compare le chapitre avec :

- la bible ;
- les connaissances ;
- la timeline ;
- les relations ;
- les objets ;
- les événements ;
- les chapitres précédents lorsque nécessaire.

Il produit un rapport.

Exemple :

```md
# Audit continuité — chapitre 14

## C14-01 — ERREUR

Sophie mentionne le dossier B-17.

Selon `knowledge.json`, Sophie n’a jamais appris son existence.

Sévérité : critique.

Correction recommandée :
soit supprimer cette connaissance,
soit introduire auparavant une scène dans laquelle Sophie l’apprend.
```

Il ne réécrit normalement pas le chapitre directement.

Il détecte et documente.

---

# 18. Agent dialogues

Analyse uniquement les dialogues.

Il vérifie :

- voix distinctes ;
- vocabulaire ;
- répétitions ;
- exposition artificielle ;
- sous-texte ;
- cohérence émotionnelle ;
- connaissances accessibles au personnage ;
- longueur excessive des échanges.

Une erreur fréquente des textes générés est que plusieurs personnages finissent par parler avec la même voix.

Cet agent doit précisément lutter contre ce phénomène.

---

# 19. Agent style

Compare le manuscrit avec `bible/style.md`.

Il recherche notamment :

- répétitions de structures ;
- tics d’écriture ;
- sur-explication ;
- métaphores répétitives ;
- descriptions génériques ;
- transitions mécaniques ;
- formulations excessivement similaires ;
- changements involontaires de ton.

---

# 20. Agent rythme

Analyse la fonction dramatique des scènes.

Il vérifie :

- longueur des scènes ;
- proportion action / dialogue / introspection ;
- progression du conflit ;
- scènes redondantes ;
- chapitres sans conséquence ;
- exposition excessive ;
- accumulation artificielle de cliffhangers.

L’objectif n’est pas que tout soit rapide.

L’objectif est que chaque scène ait une fonction.

---

# 21. Agent éditeur

L’éditeur combine plusieurs niveaux d’analyse.

Il répond à des questions comme :

- le chapitre mérite-t-il d’exister ?
- son objectif dramatique est-il atteint ?
- les personnages prennent-ils réellement des décisions ?
- le conflit avance-t-il ?
- une révélation arrive-t-elle trop tôt ?
- le lecteur dispose-t-il des informations nécessaires ?
- le chapitre prépare-t-il correctement la suite ?

Il produit des demandes de révision plutôt qu’une réécriture anarchique.

---

# 22. Réviseur final

Intervient après le premier draft complet.

Il doit pouvoir lire le manuscrit entier ou de larges portions avec :

- la bible ;
- les arcs ;
- la timeline ;
- les promesses narratives ;
- les rapports précédents.

Il réalise une analyse globale.

Sa mission est différente des audits chapitre par chapitre.

Certaines faiblesses ne deviennent visibles qu’à l’échelle du roman entier :

- personnage secondaire disparu ;
- arc trop tardif ;
- révélation mal préparée ;
- thème abandonné ;
- répétition de structures ;
- milieu du livre trop lent ;
- climax insuffisamment préparé.

---

# 23. Workflow complet

## Phase 0 — Initialisation

Création :

- `AGENTS.md`
- `README.md`
- structure du repository
- contraintes générales

---

## Phase 1 — Bible

Création :

- univers ;
- personnages ;
- lieux ;
- chronologie ;
- style ;
- thèmes ;
- règles.

Un audit vérifie ensuite que la bible ne contient pas de contradiction interne.

---

## Phase 2 — Architecture narrative

Création :

- prémisse ;
- synopsis ;
- arc global ;
- arcs personnages ;
- plan des chapitres.

Le système vérifie notamment que :

- les arcs ont une progression ;
- les révélations ont des préparations ;
- les enjeux augmentent ;
- le climax résout le conflit central.

---

## Phase 3 — Préparation d’un chapitre

Avant le chapitre `N` :

1. lire son plan ;
2. consulter les états de continuité pertinents ;
3. consulter les résumés précédents ;
4. récupérer les promesses narratives ouvertes ;
5. déterminer l’état émotionnel des personnages ;
6. générer `chapter_notes/N.md`.

---

## Phase 4 — Premier draft du chapitre

L’agent auteur écrit :

```text
chapters/N.md
```

Le chapitre reçoit alors :

```text
status: draft
```

---

## Phase 5 — Extraction de continuité

Après le draft, un agent analyse ce qui vient réellement d’être écrit.

Il extrait :

- nouveaux événements ;
- changements de relation ;
- nouvelles connaissances ;
- nouveaux objets ;
- changements de localisation ;
- blessures ;
- décisions ;
- secrets révélés ;
- promesses narratives.

Il met ensuite à jour `continuity/`.

---

# 24. Important : le texte écrit est la source de vérité de l’événement

Une différence peut apparaître entre le plan et le chapitre réellement écrit.

Exemple :

Le plan dit :

> Maya découvre le dossier seule.

Mais pendant l’écriture, la scène fonctionne mieux si Jonas est présent.

Si cette variation ne casse pas l’architecture globale, le système peut l’accepter.

La continuité doit alors refléter **ce qui s’est réellement passé dans le chapitre**, pas ce qui était prévu auparavant.

Le plan représente l’intention.

Le manuscrit représente l’événement canonique une fois validé.

---

# 25. Phase 6 — Audits du chapitre

Une fois la continuité extraite, plusieurs audits peuvent être exécutés.

Ordre recommandé :

```text
CONTINUITÉ
     ↓
COHÉRENCE NARRATIVE
     ↓
DIALOGUES
     ↓
STYLE
     ↓
RYTHME
```

Les problèmes sont enregistrés dans `audits/`.

Chaque problème reçoit :

- identifiant ;
- chapitre ;
- catégorie ;
- sévérité ;
- description ;
- justification ;
- correction recommandée.

---

# 26. Niveaux de sévérité

Exemple :

```text
INFO
Suggestion facultative.

MINOR
Petite faiblesse.

MAJOR
Problème qui dégrade réellement le chapitre.

CRITICAL
Contradiction ou défaut narratif important.

BLOCKER
Empêche la suite du récit d’être écrite correctement.
```

Un chapitre ne peut pas être validé avec un problème `CRITICAL` ou `BLOCKER` non résolu.

---

# 27. Phase 7 — Révision

Les corrections sont transformées en demandes ciblées.

Exemple :

```md
# REV-014

Chapitre : 08
Sévérité : critical

Problème :
Sophie connaît le dossier B-17 sans justification.

Instruction :
Modifier uniquement la scène concernée.
Ne pas changer la chronologie.
Ne pas révéler le dossier à Sophie.
Conserver l’objectif dramatique de la scène.
```

L’auteur ou un agent de révision effectue la modification.

La modification est ensuite auditée à nouveau.

---

# 28. revisions/changelog.md

Chaque changement significatif est enregistré.

Exemple :

```md
## REV-014

Chapitre : 08

Modification :
suppression de la référence de Sophie au dossier B-17.

Raison :
contradiction avec knowledge.json.

Impact :
aucun changement sur la timeline.

Statut :
validé.
```

Le changelog évite qu’une correction future réintroduise un ancien problème.

---

# 29. Phase 8 — Validation du chapitre

Lorsque :

- les audits critiques sont résolus ;
- la continuité est à jour ;
- le résumé est généré ;
- les promesses narratives sont enregistrées ;

le chapitre peut passer à :

```text
status: validated
```

Le système passe ensuite au chapitre suivant.

---

# 30. Boucle principale

Le cœur du système peut être représenté ainsi :

```text
┌─────────────────────────────┐
│     Charger état projet     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Préparer le prochain chapitre│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│        Écrire draft         │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Extraire nouvelle continuité│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│          Auditer            │
└──────────────┬──────────────┘
               ↓
        problèmes ?
          /        \
        oui        non
         ↓          ↓
    révision    validation
         │          │
         └──────┐   │
                ↓   ↓
             audit  résumé
                  \ /
                   ↓
             chapitre suivant
```

---

# 31. Phase 9 — Audit de mi-parcours

Une vérification globale peut être effectuée tous les 4 à 6 chapitres.

Objectifs :

- éviter une dérive progressive du synopsis ;
- vérifier les arcs ;
- détecter les promesses oubliées ;
- vérifier la distribution des personnages ;
- contrôler le rythme global.

C’est plus efficace que d’attendre la fin pour découvrir qu’une erreur structurelle existe depuis 30 000 mots.

---

# 32. Phase 10 — Premier manuscrit complet

Une fois tous les chapitres validés :

```text
scripts/build_manuscript.js
```

assemble :

```text
chapters/01.md
chapters/02.md
...
```

dans :

```text
output/manuscript_draft.md
```

Le premier draft complet est ensuite considéré comme un nouvel objet à analyser.

---

# 33. Phase 11 — Audit global

Le manuscrit complet est analysé.

Le rapport doit couvrir au minimum :

```md
# Audit global

## Structure

...

## Progression dramatique

...

## Arcs des personnages

...

## Continuité

...

## Promesses narratives

...

## Révélations

...

## Rythme

...

## Dialogues

...

## Style

...

## Fin

...

## Problèmes prioritaires

...
```

Le rapport est enregistré dans :

```text
audits/global/
```

---

# 34. Phase 12 — Réécriture structurelle

Les gros problèmes doivent être corrigés avant la micro-édition.

Mauvais ordre :

```text
corriger les virgules
↓
réécrire un chapitre entier
```

Bon ordre :

```text
structure
↓
continuité
↓
personnages
↓
scènes
↓
dialogues
↓
style
↓
micro-corrections
```

Il est inutile de polir une scène qui sera supprimée.

---

# 35. Phase 13 — Passe stylistique finale

Cette passe intervient lorsque la structure est stabilisée.

Elle vise notamment :

- répétitions ;
- lourdeurs ;
- transitions ;
- phrases génériques ;
- tics du modèle ;
- exposition excessive ;
- formulations abstraites ;
- cohérence des voix ;
- cohérence du niveau de langue.

Elle ne doit normalement plus modifier les événements importants.

---

# 36. Phase 14 — Manuscrit final

Le résultat final est assemblé dans :

```text
output/manuscript.md
```

Un rapport final peut également être produit :

```text
output/final_report.md
```

Il résume :

- nombre de chapitres ;
- nombre de mots ;
- POV utilisés ;
- arcs principaux ;
- éventuels avertissements ;
- statut des promesses narratives ;
- problèmes connus restants.

---

# 37. scripts/build_manuscript.js

Fonction simple :

- lire les chapitres dans l’ordre ;
- retirer les métadonnées internes si nécessaire ;
- les concaténer ;
- produire `output/manuscript.md`.

---

# 38. scripts/word_count.js

Doit pouvoir calculer :

- mots par chapitre ;
- mots total ;
- longueur moyenne ;
- minimum ;
- maximum.

Il peut signaler les anomalies.

Exemple :

```text
C01  4 250
C02  4 180
C03  4 410
C04  1 720  WARNING
C05  4 350
```

La longueur reste un indicateur, pas une obligation mécanique.

---

# 39. scripts/validate_continuity.js

Ce script peut effectuer des contrôles simples sans LLM.

Exemples :

- identifiants inconnus ;
- références à des chapitres inexistants ;
- dates impossibles ;
- objet ayant deux propriétaires simultanés ;
- personnage déclaré dans deux lieux incompatibles au même moment ;
- promesse résolue avant son introduction ;
- clé JSON manquante.

Les incohérences sémantiques plus complexes restent traitées par l’agent de continuité.

---

# 40. scripts/project_status.js

Génère automatiquement une partie de `STATUS.md`.

Il peut afficher :

- nombre de chapitres prévus ;
- écrits ;
- validés ;
- audits ouverts ;
- révisions ouvertes ;
- nombre de mots ;
- prochaine tâche logique.

---

# 41. Gestion du contexte

Même avec une grande fenêtre de contexte, il n’est pas nécessaire de fournir le roman entier à chaque génération.

Le contexte doit être sélectionné intelligemment.

Pour écrire un chapitre, l’agent reçoit principalement :

```text
AGENTS.md
bible/style.md
bible/regles.md
plan/chapitres.md → partie correspondante
chapter_notes/N.md
summaries des chapitres pertinents
dernier chapitre complet
données de continuité pertinentes
```

Pour un audit global, en revanche, il peut être pertinent de fournir une grande partie ou la totalité du manuscrit.

---

# 42. Mémoire locale vs mémoire globale

Le système distingue deux types de mémoire.

## Mémoire globale

Informations stables ou structurantes :

- bible ;
- personnages ;
- règles ;
- arcs ;
- timeline ;
- connaissances ;
- relations ;
- promesses narratives.

## Mémoire locale

Informations utiles immédiatement pour le prochain chapitre :

- dernier chapitre ;
- état émotionnel ;
- lieu actuel ;
- conflit courant ;
- objets présents ;
- informations récemment révélées.

Cette distinction évite de surcharger inutilement les générations.

---

# 43. Éviter la dérive narrative

Un modèle génératif peut progressivement s’éloigner du projet initial.

Le système doit donc vérifier régulièrement :

```text
chapitre actuel
      ↓
comparaison
      ↓
plan chapitre
      ↓
arc personnage
      ↓
arc global
      ↓
synopsis
```

Toute divergence n’est pas mauvaise.

Une bonne improvisation peut améliorer le roman.

La question est simplement :

> La divergence améliore-t-elle le récit sans casser ce qui vient avant ou ce qui doit arriver ensuite ?

Si oui, le plan peut être mis à jour.

Si non, le chapitre doit être corrigé.

---

# 44. Éviter l’effet « IA »

Plusieurs comportements doivent être activement surveillés :

- personnages trop raisonnables ;
- dialogues trop explicatifs ;
- émotions décrites plutôt que montrées ;
- résumés moraux en fin de scène ;
- répétitions de structures syntaxiques ;
- métaphores génériques ;
- cliffhangers artificiels ;
- personnages qui comprennent trop vite ;
- conflits résolus trop proprement ;
- usage excessif de formulations abstraites ;
- répétition du nom des personnages ;
- paragraphes de longueur trop uniforme.

Les audits de style et de dialogue doivent spécifiquement rechercher ces tendances.

---

# 45. Préserver l’incertitude

L’orchestrateur connaît potentiellement toute l’histoire.

Les personnages, eux, non.

Il faut donc toujours distinguer :

```text
Vérité de l’univers
≠
Information connue du lecteur
≠
Information connue du personnage
```

`knowledge.json` sert précisément à maintenir cette frontière.

---

# 46. Canon

Le projet doit définir un ordre de priorité lorsque deux fichiers se contredisent.

Ordre recommandé :

```text
1. décision humaine explicite
2. bible/regles.md
3. manuscrit déjà validé
4. données de continuité
5. bible générale
6. plan
7. notes de chapitre
8. proposition spontanée d’un agent
```

Un agent ne doit jamais corriger silencieusement une contradiction en inventant une nouvelle règle.

---

# 47. Human-in-the-loop

Le système peut être largement automatisé, mais l’humain doit pouvoir intervenir facilement.

Il peut notamment :

- verrouiller une décision ;
- rejeter une révision ;
- modifier un arc ;
- demander une nouvelle version d’un chapitre ;
- déclarer un élément canonique ;
- modifier la bible ;
- imposer une direction artistique.

Les décisions importantes peuvent être inscrites dans les fichiers concernés afin qu’elles deviennent persistantes.

---

# 48. Git et versionnement

Le projet se prête particulièrement bien à Git.

Chaque grande étape peut être commitée.

Exemples :

```text
feat: add character bible
plan: finalize act 1
draft: write chapter 04
continuity: update chapter 04 state
fix: resolve Maya knowledge contradiction
edit: improve chapter 04 dialogue
release: complete first draft
release: final manuscript
```

Git permet :

- de comparer deux versions ;
- d’annuler une mauvaise réécriture ;
- de comprendre pourquoi un élément a changé ;
- de créer des branches expérimentales.

---

# 49. Branches expérimentales

Pour une grosse modification narrative, il est préférable de tester une branche.

Exemple :

```text
main
│
├── rewrite/chapter-09-confrontation
│
└── experiment/jonas-survives
```

Codex peut tester une variante sans détruire la version canonique.

Si la variante est meilleure, elle peut être fusionnée.

---

# 50. Orchestration multi-agent possible

Une orchestration avancée peut lancer plusieurs analyses indépendantes sur le même chapitre.

Exemple :

```text
chapitre 08
    │
    ├── Agent continuité
    ├── Agent dialogues
    ├── Agent style
    ├── Agent rythme
    └── Agent éditeur
             │
             ↓
      Synthèse des audits
             │
             ↓
        Agent réviseur
```

L’agent réviseur ne reçoit donc pas seulement une instruction vague du type :

> améliore ce chapitre.

Il reçoit une liste précise de problèmes à résoudre.

---

# 51. Orchestrateur : pseudo-procédure

```javascript
// Illustration conceptuelle, pas un programme exécutable.
// Les fonctions éditoriales représentent les tâches réalisées dans Codex.
while (!romanFinished()) {
  await loadProjectStatus();
  const chapter = nextChapter();
  await prepareChapterContext(chapter);
  await writeDraft(chapter);
  await proposeContinuityChanges(chapter);
  await generateSummary(chapter);
  await runContinuityAudit(chapter);
  await runEditorialAudit(chapter);
  await runDialogueAudit(chapter);
  await runStyleAudit(chapter);
  await runPacingAudit(chapter);

  while (criticalIssuesExist(chapter)) {
    await createRevisionRequest(chapter);
    await reviseChapter(chapter);
    await updateContinuityProposals(chapter);
    await rerunRequiredAudits(chapter);
  }

  await reviewAndPromoteContinuity(chapter);
  await validateChapter(chapter);
  await updateStatus();
}

await buildManuscript();
await runGlobalAudit();
await performStructuralRevisions();
await performFinalStylePass();
await buildFinalManuscript();
```

---

# 52. Ce que Codex apporte

Codex est particulièrement utile ici parce qu’il peut agir sur un vrai projet contenant :

- fichiers Markdown ;
- JSON ;
- scripts ;
- historique Git ;
- rapports ;
- manuscrit.

Il peut donc garder un état persistant entre les étapes au lieu de dépendre uniquement de l’historique d’une conversation.

Son rôle est moins :

> écrire 80 000 mots.

et davantage :

> piloter un système qui produit, contrôle, corrige et maintient 80 000 mots.

---

# 53. Ce que GPT-5.6 Sol apporte

GPT-5.6 Sol sert de moteur cognitif aux opérations qui nécessitent réellement du raisonnement linguistique ou narratif.

Exemples :

- conception du synopsis ;
- compréhension des motivations ;
- écriture de scènes ;
- analyse de continuité complexe ;
- critique narrative ;
- recherche d’incohérences sémantiques ;
- réécriture ;
- analyse globale.

Les tâches déterministes doivent autant que possible être laissées aux scripts.

Exemple :

Compter les mots ne nécessite pas un LLM.

Déterminer si la réaction émotionnelle d’un personnage est cohérente avec les huit chapitres précédents, oui.

---

# 54. Principe d’économie de calcul

Le système doit appliquer la règle suivante :

> utiliser du code pour les problèmes déterministes et le modèle pour les problèmes qui nécessitent du jugement.

Exemples :

```text
Comptage de mots           → script
Assemblage du manuscrit    → script
Validation JSON            → script
Tri des chapitres          → script

Analyse du rythme          → LLM
Cohérence psychologique    → LLM
Qualité des dialogues      → LLM
Révision stylistique       → LLM
```

Cela rend le système plus fiable et évite de gaspiller des tokens.

---

# 55. Statuts recommandés

Pour les chapitres :

```text
planned
prepared
draft
auditing
revision
validated
locked
```

Pour les problèmes :

```text
open
accepted
rejected
fixed
verified
```

Pour les promesses narratives :

```text
open
developing
resolved
abandoned
```

Le statut `abandoned` doit toujours être justifié.

---

# 56. Chapitres verrouillés

Une fois qu’un chapitre est considéré comme suffisamment stable, il peut devenir :

```text
status: locked
```

Un agent ne peut alors plus le modifier simplement pour améliorer une phrase ailleurs.

Une modification d’un chapitre verrouillé doit être explicitement autorisée par l’orchestrateur ou l’humain.

Cela limite les effets domino.

---

# 57. Finalité de l’architecture

Cette architecture cherche à résoudre le principal problème de la génération de fiction longue :

**la cohérence dans le temps.**

Un bon paragraphe est relativement facile à générer.

Un bon chapitre est plus difficile.

Un roman entier exige encore davantage :

- mémoire ;
- planification ;
- causalité ;
- continuité ;
- progression psychologique ;
- préparation des révélations ;
- gestion des conséquences ;
- contrôle stylistique.

La solution consiste donc à ne pas considérer le roman comme une seule génération.

Il faut le considérer comme **un projet logiciel narratif**, avec :

```text
spécifications
↓
état
↓
production
↓
tests
↓
bugs
↓
correctifs
↓
validation
↓
release
```

Codex devient l’orchestrateur du projet.

GPT-5.6 Sol fournit le raisonnement et la génération nécessaires aux tâches éditoriales.

Les fichiers du repository forment la mémoire persistante.

Les scripts vérifient les contraintes déterministes.

Les agents spécialisés limitent les erreurs.

Le manuscrit final devient le résultat d’un **processus contrôlé et itératif**, plutôt qu’une simple longue réponse générée par un modèle.

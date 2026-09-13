# Formats exécutables

Ces conventions organisent les données sans établir de fait narratif. Tous les JSON sont UTF-8 ; les registres commencent par `{}`. Les champs métier supplémentaires sont conservés mais ne sont pas validés automatiquement.

## Configuration et chapitres

`project.json` contient `title` (texte) et `plannedChapters` (`null` ou entier positif). Après validation du découpage dans le plan, reporter son nombre ici.

Chaque chapitre porte un numéro entier positif dans son nom et un en-tête restreint :

```text
---
chapter: 1
status: draft
pov: TODO
---

# Chapitre 1

Texte du chapitre.
```

Ce n'est pas du YAML général : uniquement `chapter`, `status`, `pov`, une valeur scalaire sans guillemets par ligne. Champs inconnus ou dupliqués refusés. `pov` peut être TODO pendant la préparation. `01.md` doit correspondre au numéro 1 ; `1.md` et `01.md` simultanés sont interdits.

Statuts : `planned`, `prepared`, `draft`, `auditing`, `revision`, `validated`, `locked`. Les deux premiers sont exclus du comptage et du brouillon. Les autres nécessitent du texte au-delà des titres. Les titres Markdown sont exportés mais exclus du comptage. Les apostrophes droites/courbes et les traits d'union internes comptent comme un mot : « l'étudiant », « peut-être ». Ce comptage lexical n'est pas une segmentation linguistique du japonais.

Notes et résumés portent le même nom que le chapitre. Un résumé destiné à l'export final doit contenir du texte et aucun TODO.

## Registres canoniques

Chaque fichier est un objet indexé par identifiant stable en minuscules, chiffres et underscores, commençant par une lettre. `?` signifie champ omissible ou `null`. Les références de personnage, lieu et événement doivent exister dans leurs registres ; les références de chapitre correspondent à un fichier présent. Une liste de personnages peut être vide, mais sans doublons.

| Fichier | Champs contrôlés par entrée |
|---|---|
| characters.json | `name`: texte ; `location?`: ID lieu ; `last_seen_chapter?`: entier |
| relationships.json | `characters`: liste d'ID personnages ; `relationship`: texte ; `last_change_chapter?`: entier |
| knowledge.json | `character`: ID personnage ; `fact`: texte ; `knows`: booléen ; `since_chapter?`: entier, requis si vrai, absent si faux |
| objects.json | `name`: texte ; `introduced_chapter`: entier ; `current_owner?`: ID personnage ; `current_location?`: ID lieu |
| locations.json | `name`: texte |
| events.json | `chapter`: entier ; `description`: texte ; `participants`: liste d'ID personnages ; `date?`: YYYY-MM-DD |
| promises.json | `introduced_chapter`: entier ; `description`: texte ; `status`: open/developing/resolved/abandoned ; `resolved_chapter?`: entier ; `reason?`: texte |
| timeline.json | `chapter`: entier ; `event`: ID événement ; `date`: YYYY-MM-DD ; `time`: HH:MM ; `participants`: liste d'ID personnages ; `location?`: ID lieu |

Une promesse résolue exige un chapitre de résolution supérieur ou égal à son introduction. Les autres statuts n'ont pas de chapitre de résolution. Un abandon exige `reason`.

Les dates sont vérifiées réellement, les heures utilisent 00:00 à 23:59. Une entrée de timeline doit partager le chapitre et, lorsqu'elle existe, la date de son événement. Deux positions différentes d'un personnage au même jour et à la même minute sont refusées. Les flashbacks sont autorisés : le numéro du chapitre n'impose pas l'ordre chronologique des dates.

Une propriété d'objet contient un seul propriétaire. Déplacements plausibles, durées, âges, objets dupliqués sous des ID différents et contradictions prose/données nécessitent l'audit de continuité. Ne pas inventer une date pour satisfaire le format : conserver le point inconnu dans les propositions jusqu'à décision.

`continuity/proposals/NN.md` accueille les changements d'un draft. Ces propositions ne sont pas chargées par le validateur canonique. Leur promotion est une étape éditoriale explicite, consignée dans l'audit de continuité.

## Audits

Un JSON par chapitre et catégorie : `audits/continuity/01.json`, `audits/narrative/01.json`, `audits/dialogue/01.json`, `audits/style/01.json`, `audits/pacing/01.json`. Les Markdown voisins portent l'analyse détaillée.

```json
{
  "chapter": 1,
  "category": "continuity",
  "status": "completed",
  "chapter_hash": "REMPLACER_PAR_SHA256",
  "continuity_reviewed": true,
  "issues": []
}
```

`status` vaut `pending` ou `completed`. `continuity_reviewed` est requis seulement pour la continuité et vaut vrai après contrôle des faits canoniques et de leur mise à jour. Une liste vide de problèmes est un résultat d'audit, jamais un moyen de contourner la relecture.

Obtenir les empreintes exactes depuis la racine, après lecture du chapitre :

```powershell
node --input-type=module -e "import {chapters} from './scripts/lib/project.js'; for (const c of await chapters()) console.log(c.stem, c.hash)"
```

SHA-256 porte sur le corps après retrait de l'en-tête, normalisation CRLF→LF et retrait des blancs aux extrémités. Un changement de statut seul ne périme pas les audits ; une modification du texte ou du titre les périme.

Chaque problème contient :

```json
{
  "id": "ISS-01-CONT-001",
  "chapter": 1,
  "category": "continuity",
  "severity": "CRITICAL",
  "status": "open",
  "description": "Décrire le problème observé.",
  "justification": "Citer les sources contradictoires.",
  "recommendation": "Décrire la correction ciblée."
}
```

L'ID est unique dans tous les audits. Sévérités : INFO, MINOR, MAJOR, CRITICAL, BLOCKER. Statuts : open, accepted, rejected, fixed, verified. `accepted` signifie reconnu, pas résolu. `fixed` reste ouvert jusqu'à vérification. `rejected` exige un texte `resolution` justifiant le rejet. Seuls verified/rejected sont clôturés.

Les audits globaux sont des JSON dans `audits/global/` avec `category: global`, `status` et `issues`. Les problèmes globaux ont `category: global`, un numéro de chapitre ou `null`. L'analyse littéraire et la référence à la version examinée restent dans le rapport Markdown associé.

## Export et état

Le brouillon assemble les chapitres rédigés dans l'ordre numérique. Le final exige le découpage complet 1 à N, des statuts validated/locked, les résumés complets, les cinq audits terminés sur le texte actuel, la continuité revue et aucun CRITICAL/BLOCKER non clôturé, y compris global. Toute erreur de structure bloque l'export. Les contrôles précèdent l'écriture ; un refus laisse les exports précédents intacts.

Promesses ouvertes et problèmes non critiques figurent dans le rapport final. La revue globale, l'analyse des arcs et les décisions de publication restent éditoriales.

Le statut remplace uniquement le bloc `generated:status:start/end`. Les phases et notes humaines restent hors de ce bloc. Les demandes Markdown dans `revisions/requests/` sont comptées comme ouvertes ; les déplacer dans `revisions/completed/` après vérification.

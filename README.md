# Yaku-apa

Atelier de roman piloté dans Codex : comédie noire, action et vie étudiante au Japon. La prémisse est dans [plan/premise.md](plan/premise.md), les règles canoniques dans [bible/regles.md](bible/regles.md).

Le socle technique est opérationnel. Le découpage, les choix narratifs encore marqués TODO et la rédaction restent à faire.

## Démarrage sous Windows

Node.js 24, npm et Git suffisent. Les outils narratifs utilisent les modules natifs. Le lecteur web utilise Marked, DOMPurify et esbuild ; aucune clé API ni base de données n'est nécessaire.

```powershell
Set-Location D:\dev\yaku-apa
npm.cmd ci
npm.cmd run doctor
npm.cmd run validate
npm.cmd run status
npm.cmd test
```

`npm.cmd` fonctionne dans PowerShell sans modifier la politique d'exécution. Si votre terminal autorise `npm`, les deux formes sont équivalentes. Version locale vérifiée : Node.js 24.13.1. `.node-version` sert de repère aux gestionnaires de versions, sans installation automatique.

## Commandes

| Commande | Effet |
|---|---|
| `npm.cmd run doctor` | Vérifie l'environnement et la structure. |
| `npm.cmd run count` | Compte les mots des chapitres rédigés, hors métadonnées et titres. |
| `npm.cmd run validate` | Vérifie configuration, chapitres, registres et audits JSON. |
| `npm.cmd run status` | Affiche compteurs et prochaine tâche suggérée. |
| `npm.cmd run status -- --write` | Actualise uniquement le bloc généré de STATUS.md. |
| `npm.cmd run build` | Assemble les chapitres rédigés dans output/manuscript_draft.md. |
| `npm.cmd run build -- --final` | Contrôle la validation puis écrit output/manuscript.md et final_report.md. |
| `npm.cmd test` | Lance les tests sur des fichiers temporaires isolés. |

Une erreur retourne le code 1 avec un diagnostic. Aucun export vide n'est produit. Les scripts trouvent la racine depuis leur emplacement et n'écrivent jamais dans les chapitres, la bible ou les registres canoniques.

## Organisation

- `AGENTS.md`, `DECISIONS.md`, `STATUS.md` : règles, décisions humaines, état du travail.
- `bible/`, `plan/` : canon stable et intention narrative importés du starter.
- `chapters/`, `chapter_notes/`, `summaries/` : prose, préparation et mémoire locale.
- `continuity/` : état canonique structuré ; `continuity/proposals/` : changements proposés après un brouillon.
- `audits/` : continuité, narration, dialogues, style, rythme et revue globale.
- `revisions/` : demandes ouvertes, corrections terminées et historique.
- `templates/` : modèles à copier, jamais considérés comme des chapitres.
- `scripts/`, `tests/` : outils JavaScript et vérifications.
- `output/` : exports régénérables, ignorés par Git.
- `docs/` : [workflow](docs/workflow.md), [formats](docs/formats.md), [rôles](docs/roles.md), [architecture adaptée](docs/architecture.md).

## Reprendre dans Codex

Ouvrir ce dossier comme projet, puis demander :

> Lis AGENTS.md et STATUS.md, exécute les contrôles du projet et identifie la prochaine tâche. Préserve les TODO et le canon ; présente séparément toute décision créative nécessaire.

Le modèle se choisit dans Codex. Le dépôt ne change pas les paramètres globaux de l'application. Les étapes éditoriales se font dans les échanges avec Codex ; les commandes npm assurent les tâches déterministes.

Après une étape importante, actualiser le statut et créer un commit ciblé. Dépôt public : [kabomane/yaku-apa](https://github.com/kabomane/yaku-apa). Les sources Markdown et JSON sont la référence.

## Conventions

JavaScript ESM, Node.js 24, UTF-8, fins de ligne LF. Aucun outil Python ou TypeScript. Les chapitres suivent `01.md`, `02.md`, etc., avec un même nom pour leurs notes, résumés et audits. Voir [docs/formats.md](docs/formats.md).

Le nombre cible et la longueur du roman ne sont pas inventés. `project.json.plannedChapters` reste `null` jusqu'au découpage validé ; l'export final exige ensuite les chapitres 1 à N. PDF, DOCX et orchestration API autonome ne font pas partie de ce socle.

## Lecteur web et GitHub Pages

[Ouvrir le lecteur](https://kabomane.github.io/yaku-apa/) : arborescence, recherche de fichiers, Markdown formaté, texte ajustable, thème clair/sombre et carnet de notes ou idées par document.

Le dépôt et le site sont publics, y compris bible, plans et révélations. Les notes du carnet ne sont jamais envoyées à GitHub : elles restent dans le localStorage du navigateur, par appareil et origine. Le bouton d'export télécharge une copie JSON. Effacer les données du navigateur efface ces notes ; elles ne se synchronisent pas entre appareils. L'aperçu local et le site publié ont des carnets distincts.

```powershell
npm.cmd run reader:build
npm.cmd run reader:serve
```

L'aperçu s'ouvre sur http://127.0.0.1:4173. Chaque push sur `main` reconstruit et déploie le lecteur via `.github/workflows/pages.yml`. L'arborescence contient les fichiers texte versionnés du dépôt et les dossiers vides ; les fichiers générés et ignorés sont exclus. Les fichiers sont embarqués dans le site : aucun jeton ni appel à l'API GitHub n'est nécessaire pendant la lecture.

Sur mobile, fichiers et carnet s'ouvrent en panneaux modaux. Champs de saisie à 16 px minimum, cibles tactiles adaptées, zones sûres et hauteur dynamique pour iOS/Android. `touch-action: manipulation` évite le zoom au double toucher ; le zoom volontaire par pincement reste disponible. Voir [docs/reader.md](docs/reader.md).

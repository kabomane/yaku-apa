# Workflow éditorial

## Reprise

Lire AGENTS.md, STATUS.md et les fichiers requis par la matrice de lecture. Lancer `npm.cmd run doctor`, `npm.cmd run validate`, puis `npm.cmd run status`. Annoncer le rôle actif et les sources utiles. Les données sur disque priment sur les souvenirs de conversation.

## Avant la rédaction

1. Examiner les TODO nécessaires à la scène ; demander les arbitrages qui modifient le canon.
2. Consigner les décisions validées dans DECISIONS.md et la source canonique concernée.
3. Établir le découpage dans le plan. Une fois validé, renseigner `plannedChapters` dans project.json.
4. Copier les modèles utiles vers les dossiers de travail selon docs/formats.md.

## Boucle de chapitre

1. **Préparer** : créer chapter_notes/NN.md à partir du plan, de la bible, des résumés utiles et de la continuité. Distinguer vérité, savoir du lecteur et savoir de chaque personnage.
2. **Rédiger** : écrire la prose dans chapters/NN.md ; utiliser draft après la préparation.
3. **Extraire** : écrire summaries/NN.md et continuity/proposals/NN.md. Relever les faits du texte et écarts au plan sans modifier le canon automatiquement.
4. **Auditer** : utiliser auditing, puis les cinq rôles de docs/roles.md. Chaque audit JSON correspond à l'empreinte du texte examiné.
5. **Réviser** : créer les demandes ciblées dans revisions/requests/, utiliser revision, appliquer les corrections permises, actualiser résumé/propositions et refaire les audits affectés. Confirmer les autres avant de renouveler leurs empreintes.
6. **Valider** : après résolution vérifiée des CRITICAL/BLOCKER, vérifier le résumé et promouvoir les faits approuvés dans les registres. Faire la vérification finale de continuité, noter les faits promus dans son rapport, renseigner continuity_reviewed, puis passer le chapitre à validated. Le contrôle structurel ne prend pas cette décision à votre place.
7. **Tracer** : consigner les changements significatifs, déplacer les demandes vérifiées dans completed, actualiser STATUS.md, créer un commit cohérent. Passer au chapitre suivant.

Toute correction d'un fait déjà validé exige une revue des conséquences dans les chapitres suivants. Les propositions promues restent archivées avec leur statut et références ; les registres sont la source canonique. Un chapitre locked exige une autorisation humaine explicite pour toute réécriture.

## Revue globale et assemblage

Tous les cinq chapitres validés, puis en fin de manuscrit, revoir structure, causalité, arcs, révélations, promesses et rythme. Documenter dans audits/global/ et créer les demandes nécessaires.

Traiter structure et continuité, puis scènes/dialogues/style, enfin les micro-corrections. Réauditer les chapitres modifiés. Générer le brouillon avec `npm.cmd run build`, puis le final avec `npm.cmd run build -- --final`. Relire le résultat et son rapport avant diffusion.

Les scripts contrôlent la structure documentée, pas la psychologie ni la qualité littéraire. Aucun chapitre n'est écrit, validé ou verrouillé automatiquement.

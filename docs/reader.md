# Lecteur web

## Architecture

`reader/` contient HTML, CSS et JavaScript. `npm run reader:build` regroupe le code avec esbuild dans `dist/` et produit `content.json` depuis les seuls fichiers `.md` du dépôt. L'arborescence montre uniquement les dossiers qui contiennent des documents Markdown. Aucun appel GitHub côté navigateur : la version publiée correspond au dernier déploiement réussi.

Le rendu Markdown GFM passe par Marked puis DOMPurify. Les liens relatifs vers les documents `.md` disponibles restent dans le lecteur ; liens HTTP externes dans un nouvel onglet. Les tableaux et blocs de code défilent horizontalement sans élargir la page.

Les chemins et ancres sont conservés dans le fragment URL, ce qui permet retour/précédent et ouverture directe sous `/yaku-apa/`, sans routage serveur. Les dernières préférences de lecture sont locales.

## Carnet

Chaque note est un objet `{id,file,kind,text,createdAt,updatedAt}`. `kind` vaut `idea` ou `note`. Une clé `yaku-apa:notes:v1:<id>` par entrée évite d'écraser les autres notes lors d'écritures sur plusieurs onglets. L'événement storage actualise la liste entre onglets. Deux modifications simultanées d'une même entrée suivent la dernière écriture.

Ajout, modification, suppression avec annulation et export JSON sont disponibles. Les brouillons sont conservés localement séparément des notes enregistrées. Un stockage indisponible ou saturé produit un message d'échec et conserve le texte dans le champ. Les notes ne sont ni publiques ni synchronisées. Les notes d'anciens fichiers retirés du lecteur restent stockées et incluses dans l'export, mais ne figurent plus dans le carnet visible.

## Responsive et tactile

- À partir de 1180 px : bibliothèque, lecture et carnet latéral repliable.
- De 760 à 1179 px : bibliothèque latérale et carnet dans un dialogue.
- En dessous de 760 px : lecture pleine largeur, bibliothèque et carnet dans des dialogues natifs avec fermeture et gestion du focus.
- Tailles de saisie ≥ 16 px pour éviter le zoom de focus iOS ; `touch-action: manipulation` pour supprimer le double-tap zoom en gardant le pincement volontaire ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)).
- `100dvh`, safe-area insets, zones défilantes et tailles tactiles adaptées. Le clavier n'est pas ouvert automatiquement en entrant dans un panneau mobile.

## Publication

Le workflow officiel configure Pages, charge `dist/` comme artefact et le déploie après tests et validation. Le dépôt doit avoir Pages configuré sur GitHub Actions. Voir [GitHub Pages : workflows personnalisés](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Le carnet du domaine localhost et celui de github.io sont distincts. Aucun secret n'est embarqué dans le site. Ne jamais ajouter de données privées dans les sources du dépôt public.

## Vérification

Les tests Node/jsdom couvrent le rendu Markdown, liens, neutralisation des contenus actifs et persistance des notes. La construction et les ressources HTTP sont contrôlées séparément. Les appareils physiques iOS/Android ne sont pas testés automatiquement par cette suite.

Sur les navigateurs proposant `document.modelContext`, deux outils facultatifs permettent d'ouvrir un document et de préparer une note à relire. Les autres navigateurs ignorent cette intégration. Aucun contexte WebMCP de navigateur n'est disponible pour sa validation dans cette session.

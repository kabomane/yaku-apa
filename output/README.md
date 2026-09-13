# Exports

Les fichiers générés sont ignorés par Git et reconstruits depuis les sources.

- `npm.cmd run build` : manuscript_draft.md.
- `npm.cmd run build -- --final` : manuscript.md et final_report.md.

Un projet sans chapitre ne produit pas de manuscrit vide. Un export refusé ne remplace pas un export antérieur : consulter le diagnostic et régénérer après correction.

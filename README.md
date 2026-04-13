# Sudoku Grid Viewer

Editeur Sudoku en React (Vite + TypeScript), oriente annotation libre.

## Fonctions disponibles

- Import d'une image Sudoku.
- Surlignage des cases (couleur de fond).
- Couleur du texte (chiffres et notes).
- Saisie libre des chiffres (1 a 9), au clic ou au clavier.
- Mode notes avec mini-grille 3x3.
- Multi-selection de cases (Ctrl/Cmd + clic).
- Export PNG de la grille (avec ou sans legendes).
- Import / export JSON de l'etat complet.

## Mode d'emploi

Utiliser le site en local avec `npm run dev`.

### 1) Pre-requis

1. Installer Node.js LTS: https://nodejs.org
2. Ouvrir un terminal dans le dossier du projet (celui qui contient `package.json`).

### 2) Lancer le site

1. Installer les dependances:

   npm install

2. Demarrer l'application:

   npm run dev

3. Ouvrir dans le navigateur l'adresse affichee dans le terminal.

Adresse la plus frequente:

   http://localhost:5173

### 3) Utilisation rapide

1. Import image: bouton `Import image`.
2. Entrer des chiffres:
   - Mode `Numbers` + clic sur 1-9, ou clavier 1-9.
3. Entrer des notes:
   - Mode `Notes`, puis 1-9 pour activer/desactiver les possibilites.
4. Multi-selection:
   - `Ctrl` (ou `Cmd` sur Mac) + clic sur plusieurs cases.
5. Couleurs:
   - `Highlight` pour la couleur de fond.
   - `Number color` pour la couleur du texte.
6. Export image:
   - `Download grid (with legends)` ou `Download grid (no legends)`.
7. Sauvegarde complete:
   - `Export JSON`.
8. Recharger une sauvegarde:
   - `Import JSON`.

### 4) Arreter le site

Dans le terminal, faire `Ctrl + C`.

## Commandes utiles

- Dev: `npm run dev`
- Build: `npm run build`

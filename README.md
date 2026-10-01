# Apitah

**Générateur intelligent de documents personnalisés**

Apitah permet de créer des modèles de documents, importer des données Excel/CSV, placer des champs dynamiques sur une maquette et générer des documents personnalisés en série.

## Stack
- Frontend : React 19 + TypeScript + Vite
- Données : Supabase
- Excel/CSV : SheetJS (xlsx)
- PDF : jsPDF
- ZIP : JSZip
- UI : Lucide React
- Déploiement : Vercel

## Modules
Dashboard · Jobs/types de documents · Champs dynamiques · Modèles · Éditeur visuel · Import Excel · Personnes · Numérotation · Génération PDF · QR de vérification.

## Supabase
Variables publiques Vite :
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

Ne jamais placer une clé service_role ou une clé secrète dans le frontend.

Le backend Supabase du projet Apitah contient les tables nécessaires aux documents, modèles, éléments, personnes, imports, lignes d'import, séries et documents générés. Les accès sont protégés par RLS.

## Développement
npm install
npm run dev

## Production
npm run build
npm run preview

## Vercel
vercel.json configure le build Vite et le dossier dist. Ajouter dans les variables d'environnement Vercel :
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY

## Organisation
src/
├── App.tsx
├── cloud.ts
├── data.ts
├── types.ts
├── lib/
│   ├── supabase.ts
│   ├── apitah-types.ts
│   └── field-mapping.ts
└── styles.css

La prochaine phase consiste à découper progressivement l'écran principal en modules sans casser les fonctionnalités déjà présentes.

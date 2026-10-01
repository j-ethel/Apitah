import type { DynamicField, CanvasElement } from "./types";

export const dynamicFields: DynamicField[] = [
  { id: "1", label: "Nom complet", key: "nom_complet", type: "text" },
  { id: "2", label: "Fonction", key: "fonction", type: "text" },
  { id: "3", label: "Date de naissance", key: "date_naissance", type: "date" },
  { id: "4", label: "Matricule", key: "matricule", type: "text" },
  { id: "5", label: "Genre", key: "genre", type: "select", options: ["Femme", "Homme", "Autres"] },
  { id: "6", label: "Photo", key: "photo", type: "image" }
];

export const initialElements: CanvasElement[] = [
  { id: "e1", type: "shape", label: "Fond de carte", x: 0, y: 0 },
  { id: "e2", type: "image", label: "Photo", x: 32, y: 34 },
  { id: "e3", type: "field", label: "{{nom_complet}}", x: 126, y: 42 },
  { id: "e4", type: "field", label: "{{fonction}}", x: 126, y: 76 },
  { id: "e5", type: "field", label: "{{matricule}}", x: 126, y: 110 }
];
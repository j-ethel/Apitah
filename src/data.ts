import type { DynamicField, CanvasElement } from "./types";

export const dynamicFields: DynamicField[] = [
  { id: "1", label: "Nom complet", key: "nom_complet", type: "text" },
  { id: "2", label: "Fonction", key: "fonction", type: "text" },
  { id: "3", label: "Date de naissance", key: "date_naissance", type: "date" },
  { id: "4", label: "Matricule", key: "matricule", type: "text" },
  { id: "5", label: "Genre", key: "genre", type: "select", options: ["Femme", "Homme", "Autres"] },
  { id: "6", label: "Photo", key: "photo", type: "image" }
];

const base = { width: 130, height: 28, fontSize: 13, fontWeight: "600" as const, align: "left" as const };

export const initialElements: CanvasElement[] = [
  { id: "e1", type: "shape", label: "Fond de carte", x: 0, y: 0, width: 425, height: 270, ...base },
  { id: "e2", type: "image", label: "Photo", x: 32, y: 34, width: 75, height: 92, ...base },
  { id: "e3", type: "field", label: "{{nom_complet}}", x: 126, y: 42, ...base },
  { id: "e4", type: "field", label: "{{fonction}}", x: 126, y: 76, ...base },
  { id: "e5", type: "field", label: "{{matricule}}", x: 126, y: 110, ...base }
];
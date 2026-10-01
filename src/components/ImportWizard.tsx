import { useMemo, useState } from "react";
import { CheckCircle2, Eye, FileSpreadsheet, Layers3, Wand2 } from "lucide-react";
import type { ChangeEvent } from "react";
import type { DynamicField } from "../types";

type Row = Record<string, unknown>;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export default function ImportWizard({
  fileName, rows, importExcel, fields, onPreview, onBulk,
}: {
  fileName: string;
  rows: Row[];
  importExcel: (ev: ChangeEvent<HTMLInputElement>) => void;
  fields: DynamicField[];
  onPreview: () => void;
  onBulk: () => void;
}) {
  const [browse, setBrowse] = useState(false);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const mappings = useMemo(() => headers.map((header) => {
    const h = normalize(header);
    const exact = fields.find(f => normalize(f.key) === h);
    const label = fields.find(f => normalize(f.label) === h);
    const match = exact ?? label;
    return {
      header,
      field: match,
      confidence: exact ? 100 : label ? 95 : 0,
    };
  }), [headers.join("|"), fields]);

  return <div className="page">
    <div className="heading">
      <div>
        <h2>Import Excel</h2>
        <p>Importez vos données, vérifiez le mapping automatique et parcourez les lignes avant génération.</p>
      </div>
      <label className="dark upload-btn"><FileSpreadsheet size={16}/> Importer Excel
        <input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} hidden/>
      </label>
    </div>

    {!rows.length ? <div className="upload">
      <FileSpreadsheet size={34}/><h3>Commencez par importer votre fichier</h3>
      <p>Apitah détecte les colonnes et prépare automatiquement les champs dynamiques.</p>
      <label className="dark upload-btn">Choisir le fichier
        <input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} hidden/>
      </label>
    </div> : <>
      <div className="import-success">
        <CheckCircle2 size={18}/><div><b>{fileName}</b><span>{rows.length} ligne(s) · {headers.length} colonne(s)</span></div>
      </div>

      <div className="import-actions">
        <button onClick={onPreview}><Eye size={16}/> Aperçu d'une ligne</button>
        <button onClick={() => setBrowse(v => !v)}><Layers3 size={16}/> {browse ? "Masquer les lignes" : "Parcourir les lignes"}</button>
        <button className="dark" onClick={onBulk}><Wand2 size={16}/> Générer toutes les cartes</button>
      </div>

      <div className="mapping-card">
        <div className="section-title"><h3>Mapping automatique</h3><span>{mappings.filter(m => m.confidence > 0).length}/{mappings.length} reconnue(s)</span></div>
        <div className="mapping-list">
          {mappings.map(m => <div className="mapping-row" key={m.header}>
            <code>{m.header}</code><span>→</span><b>{m.field ? m.field.label : "Non reconnu"}</b>
            <small className={m.confidence >= 95 ? "match-good" : "match-none"}>{m.confidence ? m.confidence + "%" : "à mapper"}</small>
          </div>)}
        </div>
      </div>

      {browse ? <div className="excel-table">
        <div className="section-title"><h3>Parcourir les lignes</h3><span>{rows.length} enregistrements</span></div>
        <div className="table-wrap"><table><thead><tr><th>#</th>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((row,i)=><tr key={i}><td>{i+1}</td>{headers.map(h=><td key={h}>{String(row[h] ?? "")}</td>)}</tr>)}</tbody>
        </table></div>
      </div> : <div className="excel-table">
        <div className="section-title"><h3>Aperçu des données</h3><span>8 premières lignes</span></div>
        <div className="table-wrap"><table><thead><tr><th>#</th>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.slice(0,8).map((row,i)=><tr key={i}><td>{i+1}</td>{headers.map(h=><td key={h}>{String(row[h] ?? "")}</td>)}</tr>)}</tbody>
        </table></div>
      </div>}
    </>}
  </div>;
}

/**
 * ProductEditor — inline table for editing a vendor's product catalogue.
 * Supports inline editing (click a cell), row deletion, and adding new products.
 */
import { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface Product {
  name: string;
  unit: string;
  rate: number;
  avg_qty?: number;
  frequency?: number;
}

interface Props {
  vendorName: string;
  products: Product[];
  onUpsert: (originalName: string, name: string, unit: string, rate: number) => void;
  onDelete: (name: string) => void;
}

const T = {
  bg: "hsl(37 47% 96%)",
  surface: "#fff",
  border: "hsl(37 20% 88%)",
  ink: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  amber: "hsl(33 65% 46%)",
  amberLight: "hsl(37 70% 93%)",
};

interface EditingCell {
  rowKey: string; // product original name, or "__new__" for the add row
  field: "name" | "unit" | "rate";
}

export default function ProductEditor({ vendorName, products, onUpsert, onDelete }: Props) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  // Staged edits for the currently-editing row before commit
  const [draft, setDraft] = useState<{ name: string; unit: string; rate: string }>({
    name: "",
    unit: "",
    rate: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (rowKey: string, field: EditingCell["field"], product?: Product) => {
    if (editingCell?.rowKey === rowKey) {
      setEditingCell({ rowKey, field });
      return;
    }
    setEditingCell({ rowKey, field });
    if (product) {
      setDraft({ name: product.name, unit: product.unit, rate: String(product.rate) });
    } else {
      setDraft({ name: "", unit: "", rate: "" });
    }
  };

  const commitRow = (rowKey: string) => {
    const name = draft.name.trim();
    const unit = draft.unit.trim();
    const rate = parseFloat(draft.rate) || 0;
    if (!name) { setEditingCell(null); return; }
    const originalName = rowKey === "__new__" ? "" : rowKey;
    onUpsert(originalName, name, unit, rate);
    setEditingCell(null);
    setDraft({ name: "", unit: "", rate: "" });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowKey: string) => {
    if (e.key === "Enter") commitRow(rowKey);
    if (e.key === "Escape") { setEditingCell(null); setDraft({ name: "", unit: "", rate: "" }); }
  };

  const cellStyle = (isEditing: boolean): React.CSSProperties => ({
    fontSize: 12,
    color: T.ink,
    padding: "6px 8px",
    cursor: isEditing ? "text" : "pointer",
    borderRadius: 4,
    background: isEditing ? T.amberLight : "transparent",
    border: isEditing ? `1px solid ${T.amber}` : "1px solid transparent",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  });

  const renderCell = (rowKey: string, field: EditingCell["field"], displayValue: string) => {
    const isEditing = editingCell?.rowKey === rowKey && editingCell.field === field;
    const draftValue = field === "name" ? draft.name : field === "unit" ? draft.unit : draft.rate;

    return (
      <input
        ref={isEditing ? inputRef : undefined}
        style={cellStyle(isEditing)}
        readOnly={!isEditing}
        value={isEditing ? draftValue : displayValue}
        onFocus={() => {
          const product = products.find(p => p.name === rowKey);
          startEdit(rowKey, field, product);
        }}
        onChange={e => {
          if (field === "name") setDraft(d => ({ ...d, name: e.target.value }));
          else if (field === "unit") setDraft(d => ({ ...d, unit: e.target.value }));
          else setDraft(d => ({ ...d, rate: e.target.value }));
        }}
        onBlur={() => {
          if (editingCell?.rowKey === rowKey) commitRow(rowKey);
        }}
        onKeyDown={e => handleKeyDown(e, rowKey)}
        placeholder={isEditing ? (field === "rate" ? "0.00" : field) : ""}
      />
    );
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: T.muted,
    padding: "6px 8px",
  };

  return (
    <div
      className="rounded-lg overflow-hidden mt-3"
      style={{ border: `1px solid ${T.border}`, background: T.surface }}
    >
      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 90px 36px",
          gap: 4,
          background: "hsl(37 47% 98%)",
          borderBottom: `1px solid ${T.border}`,
          paddingRight: 8,
        }}
      >
        <span style={headerStyle}>Name</span>
        <span style={headerStyle}>Unit</span>
        <span style={headerStyle}>Rate (₹)</span>
        <span />
      </div>

      {/* Existing products */}
      {products.map(product => (
        <div
          key={product.name}
          className="group"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 90px 36px",
            gap: 4,
            alignItems: "center",
            borderBottom: `1px solid ${T.border}`,
            paddingRight: 8,
          }}
        >
          {renderCell(product.name, "name", product.name)}
          {renderCell(product.name, "unit", product.unit)}
          {renderCell(product.name, "rate", product.rate > 0 ? String(product.rate) : "")}
          <button
            type="button"
            onClick={() => onDelete(product.name)}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", height: 28, width: 28 }}
            title="Delete product"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {/* Add new product row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 90px 36px",
          gap: 4,
          alignItems: "center",
          paddingRight: 8,
          background: editingCell?.rowKey === "__new__" ? "hsl(37 47% 98%)" : "transparent",
        }}
      >
        {editingCell?.rowKey === "__new__" ? (
          <>
            {renderCell("__new__", "name", "")}
            {renderCell("__new__", "unit", "")}
            {renderCell("__new__", "rate", "")}
            <button
              type="button"
              onClick={() => { setEditingCell(null); setDraft({ name: "", unit: "", rate: "" }); }}
              style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", height: 28, width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => startEdit("__new__", "name")}
            className="flex items-center gap-1.5 px-2 py-2 transition-colors"
            style={{ color: T.muted, fontSize: 12, background: "none", border: "none", cursor: "pointer", gridColumn: "1 / -1", textAlign: "left" }}
          >
            <Plus size={12} />
            Add product
          </button>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import "./PdfSettingsModal.css";

interface Params {
  onGenerate: (spacing: number) => void;
  onCancel: () => void;
}

export function PdfSettingsModal({ onGenerate, onCancel }: Params) {
  const [spacing, setSpacing] = useState(0.2);

  const handleGenerate = () => {
    onGenerate(spacing);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="pdf-settings-backdrop" onClick={handleBackdropClick}>
      <div className="pdf-settings-content">
        <button className="pdf-settings-close" onClick={onCancel}>
          ×
        </button>

        <div className="pdf-settings-header">
          <h2>PDF Settings</h2>
        </div>

        <div className="pdf-settings-body">
          <div className="pdf-setting-row">
            <label htmlFor="pdfSpacing">Card Spacing (mm):</label>
            <input
              id="pdfSpacing"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={spacing}
              onChange={(e) => setSpacing(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="pdf-settings-actions">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleGenerate} className="btn-generate">
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}

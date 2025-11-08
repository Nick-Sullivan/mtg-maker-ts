import "./DeckInput.css";

interface Params {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function DeckInput({ value, disabled, onChange }: Params) {
  return (
    <div className="input-section">
      <label htmlFor="cardList">Paste Your Card List:</label>
      <textarea
        id="cardList"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Example:
4 Lightning Bolt
2x Counterspell
1 Black Lotus
3 Island
Sol Ring`}
      />
    </div>
  );
}

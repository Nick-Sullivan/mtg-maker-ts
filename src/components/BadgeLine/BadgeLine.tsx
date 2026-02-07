import "./BadgeLine.css";

interface BadgeLineProps {
  changeType: "added" | "removed" | "unchanged" | "increased" | "decreased";
  quantity: number;
  diff: number;
  isOldDeck: boolean;
}

export function BadgeLine({
  changeType,
  quantity,
  diff,
  isOldDeck,
}: BadgeLineProps) {
  return (
    <div className={`badge-line ${changeType}`}>
      {changeType === "removed" && "removed"}
      {changeType === "added" && "added"}
      {changeType === "unchanged" && "✓"}
      {changeType === "increased" && (
        <>
          {isOldDeck ? quantity : quantity - diff}
          <span style={{ position: "relative", top: "-2px" }}>→</span>
          {isOldDeck ? quantity + diff : quantity}
        </>
      )}
      {changeType === "decreased" && (
        <>
          {isOldDeck ? quantity : quantity - diff}
          <span style={{ position: "relative", top: "-2px" }}>→</span>
          {isOldDeck ? quantity + diff : quantity}
        </>
      )}
    </div>
  );
}

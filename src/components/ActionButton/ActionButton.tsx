import "./ActionButton.css";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function ActionButton({
  onClick,
  disabled,
  children,
}: ActionButtonProps) {
  return (
    <button className="btn-primary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

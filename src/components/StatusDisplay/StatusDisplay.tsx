import { useEffect, useState } from "react";
import { StatusType } from "../../types";
import "./StatusDisplay.css";

interface StatusDisplayProps {
  message: string;
  type: StatusType;
}

export function StatusDisplay({ message, type }: StatusDisplayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);

      if (type !== "info") {
        const timeout = setTimeout(() => {
          setVisible(false);
        }, 5000);

        return () => clearTimeout(timeout);
      }
    } else {
      setVisible(false);
    }
  }, [message, type]);

  if (!visible || !message) return null;

  return (
    <div className={`status ${type ? `status-${type}` : ""}`}>{message}</div>
  );
}

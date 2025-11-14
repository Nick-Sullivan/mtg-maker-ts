import { CardWithMetadata } from "../../types";
import "./CardArtItem.css";

interface Params {
  card: CardWithMetadata;
  onClick: () => void;
  isLoading: boolean;
  isLoaded: boolean;
}

export function CardArtItem({ card, onClick, isLoading, isLoaded }: Params) {
  if (isLoading) {
    return (
      <div className="card-art-item">
        <div className="card-loading-container">
          <div className="spinner"></div>
        </div>
        <div className="card-label">
          {card.quantity}x {card.name}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card-art-item">
        <div className="card-loading-container"></div>
        <div className="card-label">
          {card.quantity}x {card.name}
        </div>
      </div>
    );
  }

  if (card.imageUrls.length === 0) {
    return (
      <div className="card-art-item">
        <div className="card-placeholder">
          {card.quantity}x {card.name}
          {"\n"}(No image found)
        </div>
        <div className="card-label">
          {card.quantity}x {card.name}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card-art-item ${card.isDoubleFaced ? "double-faced" : ""}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div
        className={`card-image-container ${
          card.isDoubleFaced ? "double-faced" : ""
        }`}
      >
        {card.imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`${card.name} face ${index + 1}`}
            title={card.name}
            className={card.isDoubleFaced ? "card-face" : ""}
          />
        ))}
      </div>

      <div className="card-label">
        {card.quantity}x {card.name}
      </div>
    </div>
  );
}

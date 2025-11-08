import { getCardImageUrl } from "../../functions/fetchCardArt";
import { CardWithMetadata } from "../../types";
import "./CardArtItem.css";

interface Params {
  card: CardWithMetadata;
  onClick: () => void;
  isLoading: boolean;
  isLoaded: boolean;
}

export function CardArtItem({ card, onClick, isLoading, isLoaded }: Params) {
  const imageUrl = getCardImageUrl(card);
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
  if (!imageUrl) {
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
      className="card-art-item"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div className="card-image-container">
        <img src={imageUrl} alt={card.name} title={card.name} />
      </div>

      <div className="card-label">
        {card.quantity}x {card.name}
      </div>
    </div>
  );
}

import { CardWithMetadata } from "../../types";
import { CardArtItem } from "../CardArtItem/CardArtItem";
import "./CardArtGallery.css";

interface Params {
  cards: CardWithMetadata[];
  onCardClick: (index: number) => void;
  loadingIndex: number | null;
}

export function CardArtGallery({ cards, onCardClick, loadingIndex }: Params) {
  return (
    <div className="card-art-container">
      {cards.map((card, index) => (
        <CardArtItem
          key={index}
          card={card}
          onClick={() => onCardClick(index)}
          isLoading={loadingIndex === index}
          isLoaded={loadingIndex === null || loadingIndex > index}
        />
      ))}
    </div>
  );
}

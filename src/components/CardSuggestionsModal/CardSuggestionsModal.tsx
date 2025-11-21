import { useEffect, useState } from "react";
import { fetchSimilarCardNames } from "../../functions/scryfall/fetchSimilarCardNames";
import { CardWithMetadata } from "../../types";
import "./CardSuggestionsModal.css";

interface Params {
  card: CardWithMetadata;
  onClose: () => void;
  onSelectSuggestion: (cardName: string) => void;
  onUploadCustomImage: (imageUrl: string) => void;
}

export function CardSuggestionsModal({
  card,
  onClose,
  onSelectSuggestion,
  onUploadCustomImage,
}: Params) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!card.suggestedSimilarNames) {
        setIsLoadingSuggestions(true);
        const fetchedSuggestions = await fetchSimilarCardNames(card.name);
        setSuggestions(fetchedSuggestions);
        setIsLoadingSuggestions(false);
      } else {
        setSuggestions(card.suggestedSimilarNames);
      }
    };

    loadSuggestions();
  }, [card.name, card.suggestedSimilarNames]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <h2>Card Not Found: {card.name}</h2>
          <p className="modal-subtitle">
            {isLoadingSuggestions
              ? "Loading suggestions..."
              : "Did you mean one of these?"}
          </p>
        </div>

        <div className="modal-body">
          <div className="suggestions-container">
            {isLoadingSuggestions ? (
              <div className="suggestions-loading">
                <div className="spinner"></div>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-item"
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-suggestions">No similar cards found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

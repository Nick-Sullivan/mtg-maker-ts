import { useEffect, useMemo, useState } from "react";
import { parseDeck } from "../../functions/parseDeck";
import { DELAY_BETWEEN_REQUESTS } from "../../functions/scryfall/constants";
import { fetchCardImageUrl } from "../../functions/scryfall/fetchCardArt";
import { sleep } from "../../functions/sleep";
import { Card } from "../../types";
import "./DeckDiff.css";

interface CardChange {
  name: string;
  quantity: number;
}

export function DeckDiff() {
  const [oldDeckText, setOldDeckText] = useState("");
  const [newDeckText, setNewDeckText] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cardImages, setCardImages] = useState<Map<string, string>>(new Map());
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const comparison = useMemo(() => {
    const oldDeck = parseDeck(oldDeckText);
    const newDeck = parseDeck(newDeckText);

    const oldCardMap = new Map<string, number>();
    const newCardMap = new Map<string, number>();

    oldDeck.cards.forEach((card: Card) => {
      oldCardMap.set(card.name.toLowerCase(), card.quantity);
    });

    newDeck.cards.forEach((card: Card) => {
      newCardMap.set(card.name.toLowerCase(), card.quantity);
    });

    const allCardNames = new Set([...oldCardMap.keys(), ...newCardMap.keys()]);

    const added: CardChange[] = [];
    const removed: CardChange[] = [];
    const unchanged: CardChange[] = [];

    allCardNames.forEach((cardName) => {
      const oldQty = oldCardMap.get(cardName) || 0;
      const newQty = newCardMap.get(cardName) || 0;

      if (oldQty === newQty && oldQty > 0) {
        // All copies unchanged
        unchanged.push({ name: cardName, quantity: oldQty });
      } else if (oldQty < newQty) {
        // Some unchanged, some added
        if (oldQty > 0) {
          unchanged.push({ name: cardName, quantity: oldQty });
        }
        added.push({ name: cardName, quantity: newQty - oldQty });
      } else if (oldQty > newQty) {
        // Some unchanged, some removed
        if (newQty > 0) {
          unchanged.push({ name: cardName, quantity: newQty });
        }
        removed.push({ name: cardName, quantity: oldQty - newQty });
      }
    });

    // Sort alphabetically
    const sortFn = (a: CardChange, b: CardChange) =>
      a.name.localeCompare(b.name);
    added.sort(sortFn);
    removed.sort(sortFn);
    unchanged.sort(sortFn);

    return { added, removed, unchanged };
  }, [oldDeckText, newDeckText]);

  // Preload all card images when comparison changes
  useEffect(() => {
    const loadCardImages = async () => {
      const uniqueCardNames = new Set([
        ...comparison.added.map((c) => c.name),
        ...comparison.removed.map((c) => c.name),
        ...comparison.unchanged.map((c) => c.name),
      ]);

      if (uniqueCardNames.size === 0) {
        setCardImages(new Map());
        return;
      }

      const newImages = new Map<string, string>();

      for (const cardName of uniqueCardNames) {
        const imageUrl = await fetchCardImageUrl(cardName);
        if (imageUrl) {
          newImages.set(cardName, imageUrl);
        }

        // Respect Scryfall's rate limiting
        await sleep(DELAY_BETWEEN_REQUESTS);
      }

      setCardImages(newImages);
    };

    loadCardImages();
  }, [comparison]);

  const formatSection = (
    title: string,
    cards: CardChange[],
    type: "added" | "removed" | "unchanged",
  ) => {
    if (cards.length === 0) return "";

    const lines = [`\n${title}\n${"=".repeat(title.length)}`];

    cards.forEach((card) => {
      if (type === "added") {
        lines.push(`+${card.quantity}x ${card.name}`);
      } else if (type === "removed") {
        lines.push(`-${card.quantity}x ${card.name}`);
      } else {
        lines.push(`${card.quantity}x ${card.name}`);
      }
    });

    return lines.join("\n");
  };

  const copySection = async (
    cards: CardChange[],
    type: "added" | "removed" | "unchanged",
    title: string,
  ) => {
    const text = formatSection(title, cards, type);
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCardHover = (cardName: string, event: React.MouseEvent) => {
    setHoveredCard(cardName);
    setImagePosition({ x: event.clientX, y: event.clientY });
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredCard) {
      setImagePosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className="deck-diff-container" onMouseMove={handleMouseMove}>
      <div className="deck-diff-header">
        <h1>Deck Difference</h1>
      </div>

      <div className="deck-diff-inputs">
        <div className="deck-input-section">
          <label>Old Decklist</label>
          <textarea
            value={oldDeckText}
            onChange={(e) => setOldDeckText(e.target.value)}
            placeholder="4 Lightning Bolt
2 Counterspell
1 Black Lotus"
          />
        </div>

        <div className="deck-input-section">
          <label>New Decklist</label>
          <textarea
            value={newDeckText}
            onChange={(e) => setNewDeckText(e.target.value)}
            placeholder="3 Lightning Bolt
2 Counterspell
1 Sol Ring"
          />
        </div>
      </div>

      <div className="deck-diff-results">
        {comparison.added.length > 0 && (
          <div className="diff-section added">
            <div className="diff-section-header">
              <h2>
                Added (
                {comparison.added.reduce((sum, c) => sum + c.quantity, 0)}{" "}
                cards)
              </h2>
              <button
                onClick={() => copySection(comparison.added, "added", "ADDED")}
                className="btn-copy-section"
                title="Copy added cards"
              >
                📋
              </button>
            </div>
            <ul>
              {comparison.added.map((card) => (
                <li key={card.name}>
                  <span className="quantity">+{card.quantity}</span>
                  <span
                    className="card-name"
                    onMouseEnter={(e) => handleCardHover(card.name, e)}
                    onMouseLeave={handleCardLeave}
                  >
                    {card.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comparison.removed.length > 0 && (
          <div className="diff-section removed">
            <div className="diff-section-header">
              <h2>
                Removed (
                {comparison.removed.reduce((sum, c) => sum + c.quantity, 0)}{" "}
                cards)
              </h2>
              <button
                onClick={() =>
                  copySection(comparison.removed, "removed", "REMOVED")
                }
                className="btn-copy-section"
                title="Copy removed cards"
              >
                📋
              </button>
            </div>
            <ul>
              {comparison.removed.map((card) => (
                <li key={card.name}>
                  <span className="quantity">-{card.quantity}</span>
                  <span
                    className="card-name"
                    onMouseEnter={(e) => handleCardHover(card.name, e)}
                    onMouseLeave={handleCardLeave}
                  >
                    {card.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comparison.unchanged.length > 0 && (
          <div className="diff-section unchanged">
            <div className="diff-section-header">
              <h2>
                Unchanged (
                {comparison.unchanged.reduce((sum, c) => sum + c.quantity, 0)}{" "}
                cards)
              </h2>
              <button
                onClick={() =>
                  copySection(comparison.unchanged, "unchanged", "UNCHANGED")
                }
                className="btn-copy-section"
                title="Copy unchanged cards"
              >
                📋
              </button>
            </div>
            <ul>
              {comparison.unchanged.map((card) => (
                <li key={card.name}>
                  <span className="quantity">{card.quantity}x</span>
                  <span
                    className="card-name"
                    onMouseEnter={(e) => handleCardHover(card.name, e)}
                    onMouseLeave={handleCardLeave}
                  >
                    {card.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {oldDeckText === "" && newDeckText === "" && (
          <div className="diff-empty">
            Paste decklists above to see the comparison
          </div>
        )}
      </div>

      {hoveredCard && cardImages.has(hoveredCard) && (
        <div
          className="card-image-preview"
          style={{
            left: `${imagePosition.x + 20}px`,
            top: `${imagePosition.y + 20}px`,
          }}
        >
          <img src={cardImages.get(hoveredCard)} alt={hoveredCard} />
        </div>
      )}
    </div>
  );
}

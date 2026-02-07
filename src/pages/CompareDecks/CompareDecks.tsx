import { Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseDeck } from "../../functions/parseDeck";
import { DELAY_BETWEEN_REQUESTS } from "../../functions/scryfall/constants";
import { fetchCardImageUrl } from "../../functions/scryfall/fetchCardArt";
import { sleep } from "../../functions/sleep";
import { Card } from "../../types";
import "./CompareDecks.css";

interface CardChange {
  name: string;
  quantity: number;
}

export function CompareDecks() {
  const [oldDeckText, setOldDeckText] = useState("");
  const [newDeckText, setNewDeckText] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cardImages, setCardImages] = useState<Map<string, string>>(new Map());
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isNarrowLayout, setIsNarrowLayout] = useState(false);
  const fetchingCards = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkLayout = () => {
      // Check if the media query that stacks the inputs is active
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      setIsNarrowLayout(mediaQuery.matches);
    };

    checkLayout();

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsNarrowLayout(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

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
  useEffect(() => {
    if (isNarrowLayout) {
      return;
    }

    const timeoutId = setTimeout(() => {
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

        const cardsToFetch = Array.from(uniqueCardNames).filter(
          (name) => !cardImages.has(name) && !fetchingCards.current.has(name), // Check both
        );

        if (cardsToFetch.length === 0) {
          return;
        }

        const newImages = new Map(cardImages);

        for (const cardName of cardsToFetch) {
          fetchingCards.current.add(cardName); // Mark as fetching
          const imageUrl = await fetchCardImageUrl(cardName);
          if (imageUrl) {
            newImages.set(cardName, imageUrl);
          }
          fetchingCards.current.delete(cardName); // Mark as done

          // Respect Scryfall's rate limiting
          await sleep(DELAY_BETWEEN_REQUESTS);
        }

        setCardImages(newImages);
      };

      loadCardImages();
    }, 2_000);

    return () => clearTimeout(timeoutId);
  }, [comparison, isNarrowLayout]);

  const formatSection = (cards: CardChange[]) => {
    if (cards.length === 0) return "";

    const lines: string[] = [];

    cards.forEach((card) => {
      lines.push(`${card.quantity}x ${card.name}`);
    });

    return lines.join("\n");
  };

  const copySection = async (cards: CardChange[]) => {
    const text = formatSection(cards);
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCardHover = (cardName: string, event: React.MouseEvent) => {
    if (isNarrowLayout) return;

    setHoveredCard(cardName);
    setImagePosition({ x: event.clientX, y: event.clientY });

    // Only fetch if not already cached AND not currently being fetched
    if (!cardImages.has(cardName) && !fetchingCards.current.has(cardName)) {
      fetchingCards.current.add(cardName);
      fetchCardImageUrl(cardName).then((imageUrl) => {
        if (imageUrl) {
          setCardImages((prev) => new Map(prev).set(cardName, imageUrl));
        }
        fetchingCards.current.delete(cardName);
      });
    }
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredCard && !isNarrowLayout) {
      setImagePosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className="compare-decks-container" onMouseMove={handleMouseMove}>
      <div className="compare-decks-header">
        <h1>Compare Decks</h1>
      </div>

      <div className="compare-decks-inputs">
        <div className="deck-input-section">
          <label>Old Deck</label>
          <textarea
            value={oldDeckText}
            onChange={(e) => setOldDeckText(e.target.value)}
            placeholder="4 Lightning Bolt
2 Counterspell
1 Black Lotus"
          />
        </div>

        <div className="deck-input-section">
          <label>New Deck</label>
          <textarea
            value={newDeckText}
            onChange={(e) => setNewDeckText(e.target.value)}
            placeholder="3 Lightning Bolt
2 Counterspell
1 Sol Ring"
          />
        </div>
      </div>

      <div className="compare-decks-results">
        {comparison.added.length > 0 && (
          <div className="diff-section added">
            <div className="diff-section-header">
              <h2>
                Added (
                {comparison.added.reduce((sum, c) => sum + c.quantity, 0)}{" "}
                cards)
              </h2>
              <button
                onClick={() => copySection(comparison.added)}
                className="btn-copy-section"
                title="Copy added cards"
              >
                <Copy size={16} />
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
                onClick={() => copySection(comparison.removed)}
                className="btn-copy-section"
                title="Copy removed cards"
              >
                <Copy size={16} />
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
                onClick={() => copySection(comparison.unchanged)}
                className="btn-copy-section"
                title="Copy unchanged cards"
              >
                <Copy size={16} />
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

      {!isNarrowLayout && hoveredCard && (
        <div
          className="card-image-preview"
          style={{
            left: `${imagePosition.x + 20}px`,
            top: `${imagePosition.y + 20}px`,
            cursor: cardImages.has(hoveredCard) ? "default" : "wait",
          }}
        >
          {cardImages.has(hoveredCard) ? (
            <img src={cardImages.get(hoveredCard)} alt={hoveredCard} />
          ) : (
            <div className="preview-loading">Loading...</div>
          )}
        </div>
      )}
    </div>
  );
}

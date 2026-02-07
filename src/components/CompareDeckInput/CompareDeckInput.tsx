import { RefObject, useEffect, useRef } from "react";
import { parseDeck } from "../../functions/parseDeck";
import { BadgeLine } from "../BadgeLine/BadgeLine";
import "./CompareDeckInput.css";

interface CardWithChange {
  name: string;
  quantity: number;
  changeType: "added" | "removed" | "unchanged" | "increased" | "decreased";
  diff: number;
}

type SortBy =
  | "input"
  | "alphabetical-asc"
  | "alphabetical-desc"
  | "alphabetical-aligned"
  | "changeType-asc"
  | "changeType-desc"
  | "alignment";

interface CompareDeckInputProps {
  label: string;
  deckText: string;
  onDeckTextChange: (text: string) => void;
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  sortedCards: (CardWithChange | null)[];
  placeholder: string;
  isOldDeck?: boolean;
  scrollRef?: RefObject<HTMLDivElement>;
  onScroll?: () => void;
}

export function CompareDeckInput({
  label,
  deckText,
  onDeckTextChange,
  sortBy,
  onSortByChange,
  sortedCards,
  placeholder,
  isOldDeck = false,
  scrollRef,
  onScroll,
}: CompareDeckInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to recalculate
    textarea.style.height = "auto";
    // Set to scrollHeight which is the actual content height
    textarea.style.height = textarea.scrollHeight + "px";
  }, [deckText]);

  // When sort changes (but not on initial render), reorder the textarea
  useEffect(() => {
    if (!deckText || sortBy === "input") return;

    if (sortBy === "alignment" || sortBy === "alphabetical-aligned") {
      // For alignment modes, rebuild textarea with empty lines for nulls
      const lines = sortedCards.map((card) => {
        if (card === null) return "";
        return `${card.quantity} ${card.name}`;
      });
      onDeckTextChange(lines.join("\n"));
      return;
    }

    // Parse current deck to get all lines including duplicates
    const lines = deckText.split("\n").filter((line) => line.trim());
    const parsedLines = lines
      .map((line) => {
        const parsed = parseDeck(line);
        return parsed.cards.length > 0
          ? {
              originalLine: line,
              name: parsed.cards[0].name,
              quantity: parsed.cards[0].quantity,
            }
          : null;
      })
      .filter(Boolean) as Array<{
      originalLine: string;
      name: string;
      quantity: number;
    }>;

    // Create a map of card names to their change info for sorting
    const cardChangeMap = new Map<string, CardWithChange>();
    sortedCards.forEach((card) => {
      if (card !== null) {
        cardChangeMap.set(card.name.toLowerCase(), card);
      }
    });

    // Sort the parsed lines
    parsedLines.sort((a, b) => {
      const cardA = cardChangeMap.get(a.name.toLowerCase());
      const cardB = cardChangeMap.get(b.name.toLowerCase());

      if (sortBy === "alphabetical-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "alphabetical-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy.startsWith("changeType")) {
        const order =
          sortBy === "changeType-asc"
            ? {
                removed: 0,
                decreased: 1,
                added: 2,
                increased: 3,
                unchanged: 4,
              }
            : {
                removed: 4,
                decreased: 3,
                added: 2,
                increased: 1,
                unchanged: 0,
              };

        const typeA = cardA?.changeType || "unchanged";
        const typeB = cardB?.changeType || "unchanged";
        const orderDiff = order[typeA] - order[typeB];

        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    // Rebuild the text from sorted lines
    onDeckTextChange(parsedLines.map((l) => l.originalLine).join("\n"));
  }, [sortBy]);

  // Build a map of card names to their change data (aggregated)
  const cardMap = new Map<string, CardWithChange>();
  sortedCards.forEach((card) => {
    if (card !== null) {
      cardMap.set(card.name.toLowerCase(), card);
    }
  });

  // Parse each line of the textarea and match to a card
  // Track which cards we've already shown to mark duplicates
  const lines = deckText.split("\n");
  const seenCards = new Set<string>();
  const badgesForLines = lines.map((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return { type: "empty" as const };

    const parsed = parseDeck(trimmedLine);
    if (parsed.cards.length === 0) return { type: "empty" as const };

    const cardName = parsed.cards[0].name.toLowerCase();

    // Check if this is a duplicate
    if (seenCards.has(cardName)) {
      return { type: "duplicate" as const };
    }

    seenCards.add(cardName);
    const aggregatedCard = cardMap.get(cardName);

    if (!aggregatedCard) {
      return { type: "empty" as const };
    }

    // Use the aggregated card data (shows total comparison)
    return {
      type: "card" as const,
      card: aggregatedCard,
    };
  });

  const handleStatusClick = () => {
    if (sortBy === "changeType-asc") {
      onSortByChange("changeType-desc");
    } else if (sortBy === "changeType-desc") {
      onSortByChange("alignment");
    } else if (sortBy === "alignment") {
      onSortByChange("input");
    } else {
      onSortByChange("changeType-asc");
    }
  };

  const handleNameClick = () => {
    if (sortBy === "alphabetical-asc") {
      onSortByChange("alphabetical-desc");
    } else if (sortBy === "alphabetical-desc") {
      onSortByChange("alphabetical-aligned");
    } else if (sortBy === "alphabetical-aligned") {
      onSortByChange("input");
    } else {
      onSortByChange("alphabetical-asc");
    }
  };

  const getStatusSortIndicator = () => {
    if (sortBy === "changeType-asc")
      return <span className="sort-arrow">↑</span>;
    if (sortBy === "changeType-desc")
      return <span className="sort-arrow">↓</span>;
    if (sortBy === "alignment") return <span className="sort-arrow">⇅</span>;
    return null;
  };

  const getNameSortIndicator = () => {
    if (sortBy === "alphabetical-asc")
      return <span className="sort-arrow">↑</span>;
    if (sortBy === "alphabetical-desc")
      return <span className="sort-arrow">↓</span>;
    if (sortBy === "alphabetical-aligned")
      return <span className="sort-arrow">⇅</span>;
    return null;
  };

  return (
    <div className="deck-section">
      <div className="deck-title">{label}</div>

      <div className="deck-input-wrapper">
        <div className="column-headers">
          <div
            className={`column-header status-header ${sortBy.startsWith("changeType") || sortBy === "alignment" ? "active" : ""}`}
            onClick={handleStatusClick}
            title="Click to cycle: Asc → Desc → Aligned → Input Order"
          >
            Status {getStatusSortIndicator()}
          </div>
          <div
            className={`column-header name-header ${sortBy.startsWith("alphabetical") ? "active" : ""}`}
            onClick={handleNameClick}
            title="Click to cycle: A-Z → Z-A → Aligned → Input Order"
          >
            Card Name {getNameSortIndicator()}
          </div>
        </div>

        <div
          className="deck-input-with-badges"
          ref={scrollRef}
          onScroll={onScroll}
        >
          {badgesForLines.length > 0 && (
            <div className="badges-column">
              {badgesForLines.map((badge, index) => {
                if (badge.type === "card") {
                  return (
                    <BadgeLine
                      key={index}
                      changeType={badge.card.changeType}
                      quantity={badge.card.quantity}
                      diff={badge.card.diff}
                      isOldDeck={isOldDeck}
                    />
                  );
                } else if (badge.type === "duplicate") {
                  return (
                    <div key={index} className="badge-line duplicate">
                      duplicate
                    </div>
                  );
                } else {
                  return <div key={index} className="badge-line-empty"></div>;
                }
              })}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={deckText}
            onChange={(e) => onDeckTextChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}

import { useCallback, useMemo, useRef, useState } from "react";
import { CompareDeckInput } from "../../components/CompareDeckInput/CompareDeckInput";
import { parseDeck } from "../../functions/parseDeck";
import { Card } from "../../types";
import "./CompareDecks.css";

interface CardWithChange {
  name: string;
  quantity: number;
  changeType: "added" | "removed" | "unchanged" | "increased" | "decreased";
  diff: number;
}

export type SortBy =
  | "input"
  | "alphabetical-asc"
  | "alphabetical-desc"
  | "alphabetical-aligned"
  | "changeType-asc"
  | "changeType-desc"
  | "alignment";

export function CompareDecks() {
  const [oldDeckText, setOldDeckText] = useState("");
  const [newDeckText, setNewDeckText] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("input");

  const oldScrollRef = useRef<HTMLDivElement>(null);
  const newScrollRef = useRef<HTMLDivElement>(null);

  // Sync scroll positions using callback refs
  const handleOldScroll = useCallback(() => {
    if (oldScrollRef.current && newScrollRef.current) {
      newScrollRef.current.scrollTop = oldScrollRef.current.scrollTop;
    }
  }, []);

  const handleNewScroll = useCallback(() => {
    if (oldScrollRef.current && newScrollRef.current) {
      oldScrollRef.current.scrollTop = newScrollRef.current.scrollTop;
    }
  }, []);

  const { oldDeckWithChanges, newDeckWithChanges } = useMemo(() => {
    const oldDeck = parseDeck(oldDeckText);
    const newDeck = parseDeck(newDeckText);

    const oldCardMap = new Map<string, number>();
    const newCardMap = new Map<string, number>();

    // Aggregate quantities for duplicate cards
    oldDeck.cards.forEach((card: Card) => {
      const existing = oldCardMap.get(card.name.toLowerCase()) || 0;
      oldCardMap.set(card.name.toLowerCase(), existing + card.quantity);
    });

    newDeck.cards.forEach((card: Card) => {
      const existing = newCardMap.get(card.name.toLowerCase()) || 0;
      newCardMap.set(card.name.toLowerCase(), existing + card.quantity);
    });

    // Build unique card list with aggregated quantities
    const uniqueOldCards: Card[] = [];
    const seenOld = new Set<string>();
    oldDeck.cards.forEach((card) => {
      const key = card.name.toLowerCase();
      if (!seenOld.has(key)) {
        seenOld.add(key);
        uniqueOldCards.push({
          ...card,
          quantity: oldCardMap.get(key)!,
        });
      }
    });

    const uniqueNewCards: Card[] = [];
    const seenNew = new Set<string>();
    newDeck.cards.forEach((card) => {
      const key = card.name.toLowerCase();
      if (!seenNew.has(key)) {
        seenNew.add(key);
        uniqueNewCards.push({
          ...card,
          quantity: newCardMap.get(key)!,
        });
      }
    });

    const oldDeckWithChanges: CardWithChange[] = uniqueOldCards.map((card) => {
      const oldQty = card.quantity;
      const newQty = newCardMap.get(card.name.toLowerCase()) || 0;
      const diff = newQty - oldQty;

      if (newQty === 0) {
        return {
          name: card.name,
          quantity: oldQty,
          changeType: "removed" as const,
          diff: 0,
        };
      } else if (diff === 0) {
        return {
          name: card.name,
          quantity: oldQty,
          changeType: "unchanged" as const,
          diff: 0,
        };
      } else if (diff > 0) {
        return {
          name: card.name,
          quantity: oldQty,
          changeType: "increased" as const,
          diff: diff,
        };
      } else {
        return {
          name: card.name,
          quantity: oldQty,
          changeType: "decreased" as const,
          diff: diff,
        };
      }
    });

    const newDeckWithChanges: CardWithChange[] = uniqueNewCards.map((card) => {
      const newQty = card.quantity;
      const oldQty = oldCardMap.get(card.name.toLowerCase()) || 0;
      const diff = newQty - oldQty;

      if (oldQty === 0) {
        return {
          name: card.name,
          quantity: newQty,
          changeType: "added" as const,
          diff: diff,
        };
      } else if (diff === 0) {
        return {
          name: card.name,
          quantity: newQty,
          changeType: "unchanged" as const,
          diff: 0,
        };
      } else if (diff > 0) {
        return {
          name: card.name,
          quantity: newQty,
          changeType: "increased" as const,
          diff: diff,
        };
      } else {
        return {
          name: card.name,
          quantity: newQty,
          changeType: "decreased" as const,
          diff: diff,
        };
      }
    });

    return { oldDeckWithChanges, newDeckWithChanges };
  }, [oldDeckText, newDeckText]);

  const getSortedCards = (
    cards: CardWithChange[],
    sortBy: SortBy,
  ): CardWithChange[] => {
    const sorted = [...cards];

    if (sortBy === "alphabetical-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "alphabetical-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "changeType-asc") {
      const order = {
        removed: 0,
        decreased: 1,
        added: 2,
        increased: 3,
        unchanged: 4,
      };
      sorted.sort((a, b) => {
        const orderDiff = order[a.changeType] - order[b.changeType];
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === "changeType-desc") {
      const order = {
        removed: 4,
        decreased: 3,
        added: 2,
        increased: 1,
        unchanged: 0,
      };
      sorted.sort((a, b) => {
        const orderDiff = order[a.changeType] - order[b.changeType];
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      });
    }

    return sorted;
  };

  // For alignment mode, create placeholder entries
  const getAlignedCards = (
    sortAlphabetically: boolean = false,
  ): {
    oldAligned: (CardWithChange | null)[];
    newAligned: (CardWithChange | null)[];
  } => {
    const oldCards = sortAlphabetically
      ? getSortedCards(oldDeckWithChanges, "alphabetical-asc")
      : getSortedCards(oldDeckWithChanges, "changeType-asc");
    const newCards = sortAlphabetically
      ? getSortedCards(newDeckWithChanges, "alphabetical-asc")
      : getSortedCards(newDeckWithChanges, "changeType-asc");

    const oldAligned: (CardWithChange | null)[] = [];
    const newAligned: (CardWithChange | null)[] = [];

    // Get all unique card names
    const allCardNames = new Set<string>();
    oldCards.forEach((c) => allCardNames.add(c.name.toLowerCase()));
    newCards.forEach((c) => allCardNames.add(c.name.toLowerCase()));

    const oldCardMap = new Map(oldCards.map((c) => [c.name.toLowerCase(), c]));
    const newCardMap = new Map(newCards.map((c) => [c.name.toLowerCase(), c]));

    // Process cards in the specified order
    const sortedNames = Array.from(allCardNames).sort((a, b) => {
      if (sortAlphabetically) {
        // Just alphabetical order
        const oldCard = oldCardMap.get(a);
        const newCard = newCardMap.get(a);
        const nameA = oldCard?.name || newCard?.name || "";

        const oldCardB = oldCardMap.get(b);
        const newCardB = newCardMap.get(b);
        const nameB = oldCardB?.name || newCardB?.name || "";

        return nameA.localeCompare(nameB);
      } else {
        // Change type order
        const oldCard = oldCardMap.get(a);
        const newCard = newCardMap.get(a);
        const typeA = oldCard?.changeType || newCard?.changeType || "unchanged";

        const oldCardB = oldCardMap.get(b);
        const newCardB = newCardMap.get(b);
        const typeB =
          oldCardB?.changeType || newCardB?.changeType || "unchanged";

        const order = {
          removed: 0,
          decreased: 1,
          added: 2,
          increased: 3,
          unchanged: 4,
        };

        const orderDiff = order[typeA] - order[typeB];
        if (orderDiff !== 0) return orderDiff;

        const nameA = oldCard?.name || newCard?.name || "";
        const nameB = oldCardB?.name || newCardB?.name || "";
        return nameA.localeCompare(nameB);
      }
    });

    sortedNames.forEach((cardName) => {
      const oldCard = oldCardMap.get(cardName);
      const newCard = newCardMap.get(cardName);

      if (oldCard && newCard) {
        // Card exists in both decks
        oldAligned.push(oldCard);
        newAligned.push(newCard);
      } else if (oldCard && !newCard) {
        // Card only in old deck (removed)
        oldAligned.push(oldCard);
        newAligned.push(null);
      } else if (!oldCard && newCard) {
        // Card only in new deck (added)
        oldAligned.push(null);
        newAligned.push(newCard);
      }
    });

    return { oldAligned, newAligned };
  };

  const { oldSortedCards, newSortedCards } = useMemo(() => {
    if (sortBy === "alignment") {
      const { oldAligned, newAligned } = getAlignedCards(false);
      return {
        oldSortedCards: oldAligned,
        newSortedCards: newAligned,
      };
    } else if (sortBy === "alphabetical-aligned") {
      const { oldAligned, newAligned } = getAlignedCards(true);
      return {
        oldSortedCards: oldAligned,
        newSortedCards: newAligned,
      };
    } else {
      return {
        oldSortedCards: getSortedCards(oldDeckWithChanges, sortBy),
        newSortedCards: getSortedCards(newDeckWithChanges, sortBy),
      };
    }
  }, [oldDeckWithChanges, newDeckWithChanges, sortBy]);

  return (
    <div className="compare-decks-container">
      <div className="compare-decks-header">
        <h1>Compare Decks</h1>
      </div>

      <div className="compare-decks-inputs">
        <CompareDeckInput
          label="Old Deck"
          deckText={oldDeckText}
          onDeckTextChange={setOldDeckText}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortedCards={oldSortedCards}
          placeholder={`4 Lightning Bolt
2 Counterspell
1 Black Lotus`}
          isOldDeck={true}
          scrollRef={oldScrollRef}
          onScroll={handleOldScroll}
        />

        <CompareDeckInput
          label="New Deck"
          deckText={newDeckText}
          onDeckTextChange={setNewDeckText}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortedCards={newSortedCards}
          placeholder={`3 Lightning Bolt
2 Counterspell
1 Sol Ring`}
          isOldDeck={false}
          scrollRef={newScrollRef}
          onScroll={handleNewScroll}
        />
      </div>
    </div>
  );
}

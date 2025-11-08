import { useEffect, useState } from "react";
import { formatDeckList } from "../functions/copyDeckList";
import { fetchAllCardMetadata } from "../functions/fetchCardArt";
import { parseDeck } from "../functions/parseDeck";
import { CardWithMetadata, DeckWithMetadata, StatusType } from "../types";

export function useDeckManagement() {
  const [deckText, setDeckText] = useState("");
  const [currentDeck, setCurrentDeck] = useState<DeckWithMetadata | null>(null);
  const [status, setStatus] = useState({ message: "", type: "" as StatusType });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [artLoadingComplete, setArtLoadingComplete] = useState(false);

  const deck = parseDeck(deckText);

  // Auto-update deck list when currentDeck changes
  useEffect(() => {
    if (currentDeck && artLoadingComplete) {
      const formattedDeckList = formatDeckList(currentDeck);
      setDeckText(formattedDeckList);
    }
  }, [currentDeck, artLoadingComplete]);

  const handleLoadArt = async () => {
    if (deck.numCards === 0) {
      setStatus({ message: "Please paste a card list first!", type: "error" });
      return;
    }
    setIsLoading(true);
    setArtLoadingComplete(false);
    const initialCards: CardWithMetadata[] = deck.cards.map((card) => ({
      ...card,
      allPrintings: [],
      selectedIndex: 0,
    }));
    setCurrentDeck({
      cards: initialCards,
      numCards: deck.numCards,
      numUniqueCards: deck.numUniqueCards,
    });
    try {
      const cardsWithMetadata: CardWithMetadata[] = [];
      const onStartFetch = (index: number) => {
        setLoadingIndex(index);
      };
      const onFetched = (index: number, card: CardWithMetadata) => {
        cardsWithMetadata.push(card);
        setCurrentDeck((prevDeck) => {
          if (!prevDeck) {
            return prevDeck;
          }
          const updatedCards = [...prevDeck.cards];
          updatedCards[index] = card;
          return {
            ...prevDeck,
            cards: updatedCards,
          };
        });
      };
      await fetchAllCardMetadata({
        cards: deck.cards,
        onStartFetch,
        onFetched,
      });
      setArtLoadingComplete(true);
    } catch (error) {
      console.error("Error fetching card art:", error);
      setStatus({
        message: "Error fetching card art. Please try again.",
        type: "error",
      });
    } finally {
      setLoadingIndex(null);
      setIsLoading(false);
    }
  };

  return {
    deckText,
    setDeckText,
    currentDeck,
    setCurrentDeck,
    status,
    setStatus,
    isLoading,
    loadingIndex,
    artLoadingComplete,
    handleLoadArt,
  };
}

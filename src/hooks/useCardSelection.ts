import { useState } from "react";
import { DeckWithMetadata } from "../types";

export function useCardSelection(
  currentDeck: DeckWithMetadata | null,
  setCurrentDeck: React.Dispatch<React.SetStateAction<DeckWithMetadata | null>>
) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );

  const handleCardClick = (cardIndex: number) => {
    if (!currentDeck) {
      return;
    }
    setSelectedCardIndex(cardIndex);
  };

  const handleSelectPrinting = (printingIndex: number) => {
    if (!currentDeck || selectedCardIndex === null) return;

    setCurrentDeck((prevDeck) => {
      if (!prevDeck) return prevDeck;

      const updatedCards = [...prevDeck.cards];
      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        selectedIndex: printingIndex,
      };

      return {
        ...prevDeck,
        cards: updatedCards,
      };
    });
  };

  const handleUploadCustomImage = (imageUrl: string) => {
    if (!currentDeck || selectedCardIndex === null) return;

    setCurrentDeck((prevDeck) => {
      if (!prevDeck) return prevDeck;

      const updatedCards = [...prevDeck.cards];
      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        customImageUrl: imageUrl || undefined,
      };

      return {
        ...prevDeck,
        cards: updatedCards,
      };
    });
  };

  const handleCloseModal = () => {
    setSelectedCardIndex(null);
  };

  return {
    selectedCardIndex,
    handleCardClick,
    handleSelectPrinting,
    handleUploadCustomImage,
    handleCloseModal,
  };
}

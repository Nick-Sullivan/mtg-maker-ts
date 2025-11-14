import { useState } from "react";
import { getPrintingImageUrls } from "../functions/fetchCardArt";
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
      const card = updatedCards[selectedCardIndex];

      // Use getPrintingImageUrls helper for the new printing
      const selectedPrinting = card.allPrintings[printingIndex];
      const { imageUrls, isDoubleFaced } =
        getPrintingImageUrls(selectedPrinting);

      updatedCards[selectedCardIndex] = {
        ...card,
        selectedIndex: printingIndex,
        imageUrls,
        isDoubleFaced,
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
      const card = updatedCards[selectedCardIndex];

      if (imageUrl) {
        // Setting custom image
        updatedCards[selectedCardIndex] = {
          ...card,
          customImageUrl: imageUrl,
          imageUrls: [imageUrl],
          isDoubleFaced: false,
        };
      } else {
        // Clearing custom image - use getPrintingImageUrls for current printing
        const selectedPrinting = card.allPrintings[card.selectedIndex];
        const { imageUrls: newImageUrls, isDoubleFaced: newIsDoubleFaced } =
          getPrintingImageUrls(selectedPrinting);

        updatedCards[selectedCardIndex] = {
          ...card,
          customImageUrl: undefined,
          imageUrls: newImageUrls,
          isDoubleFaced: newIsDoubleFaced,
        };
      }

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

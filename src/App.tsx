import "./App.css";
import { ActionButton } from "./components/ActionButton/ActionButton";
import { CardArtGallery } from "./components/CardArtGallery/CardArtGallery";
import { CardArtModal } from "./components/CardArtModal/CardArtModal";
import { CardSuggestionsModal } from "./components/CardSuggestionsModal/CardSuggestionsModal";
import { DeckInput } from "./components/DeckInput/DeckInput";
import { PdfSettingsModal } from "./components/PdfSettingsModal/PdfSettingsModal";
import { StatusDisplay } from "./components/StatusDisplay/StatusDisplay";
import { useCardSelection } from "./hooks/useCardSelection";
import { useDeckManagement } from "./hooks/useDeckManagement";
import { usePdfGeneration } from "./hooks/usePdfGeneration";

export function App() {
  const {
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
    fetchCardAtIndex,
  } = useDeckManagement();

  const {
    selectedCardIndex,
    handleCardClick,
    handleSelectPrinting,
    handleUploadCustomImage,
    handleCloseModal,
  } = useCardSelection(currentDeck, setCurrentDeck);

  const {
    isGeneratingPdf,
    showPdfSettings,
    setShowPdfSettings,
    handleShowPdfSettings,
    handleGeneratePdf,
  } = usePdfGeneration(currentDeck, setStatus);

  const handleSelectSuggestion = async (cardName: string) => {
    if (!currentDeck || selectedCardIndex === null) return;

    setCurrentDeck((prevDeck) => {
      if (!prevDeck) return prevDeck;

      const updatedCards = [...prevDeck.cards];
      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        name: cardName,
      };

      return {
        ...prevDeck,
        cards: updatedCards,
      };
    });

    handleCloseModal();
    await fetchCardAtIndex(selectedCardIndex, cardName);
  };

  const selectedCard =
    currentDeck && selectedCardIndex !== null
      ? currentDeck.cards[selectedCardIndex]
      : null;

  return (
    <div className="container">
      <div className="header">
        <h1>Magic The Gathering PDF Maker</h1>
      </div>

      <div className="input-and-buttons-container">
        <DeckInput
          value={deckText}
          onChange={setDeckText}
          disabled={isLoading}
        />

        <div className="button-container">
          <ActionButton onClick={handleLoadArt} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load Cards"}
          </ActionButton>

          <ActionButton
            onClick={handleShowPdfSettings}
            disabled={isGeneratingPdf || !artLoadingComplete}
          >
            {isGeneratingPdf ? "Generating..." : "📄 Generate PDF"}
          </ActionButton>
        </div>
      </div>

      <StatusDisplay message={status.message} type={status.type} />

      {currentDeck && (
        <CardArtGallery
          cards={currentDeck.cards}
          onCardClick={handleCardClick}
          loadingIndex={loadingIndex}
        />
      )}

      {selectedCard &&
        (selectedCard.imageUrls.length === 0 ? (
          <CardSuggestionsModal
            card={selectedCard}
            onClose={handleCloseModal}
            onSelectSuggestion={handleSelectSuggestion}
          />
        ) : (
          <CardArtModal
            card={selectedCard}
            onClose={handleCloseModal}
            onSelectPrinting={handleSelectPrinting}
            onUploadCustomImage={handleUploadCustomImage}
          />
        ))}

      {showPdfSettings && (
        <PdfSettingsModal
          onGenerate={handleGeneratePdf}
          onCancel={() => setShowPdfSettings(false)}
        />
      )}
    </div>
  );
}

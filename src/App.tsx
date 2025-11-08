import "./App.css";
import { CardArtGallery } from "./components/CardArtGallery/CardArtGallery";
import { CardArtModal } from "./components/CardArtModal/CardArtModal";
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

  return (
    <div className="container">
      <div className="header">
        <h1>Magic The Gathering PDF Maker</h1>
      </div>

      <DeckInput value={deckText} onChange={setDeckText} disabled={isLoading} />

      <div className="button-container">
        <button
          className="btn-primary"
          onClick={handleLoadArt}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load Cards"}
        </button>

        <button
          className="btn-primary"
          onClick={handleShowPdfSettings}
          disabled={isGeneratingPdf || !artLoadingComplete}
        >
          {isGeneratingPdf ? "Generating..." : "📄 Generate PDF"}
        </button>
      </div>

      <StatusDisplay message={status.message} type={status.type} />

      {currentDeck && (
        <CardArtGallery
          cards={currentDeck.cards}
          onCardClick={handleCardClick}
          loadingIndex={loadingIndex}
        />
      )}

      {currentDeck && selectedCardIndex !== null && (
        <CardArtModal
          card={currentDeck.cards[selectedCardIndex]}
          onClose={handleCloseModal}
          onSelectPrinting={handleSelectPrinting}
          onUploadCustomImage={handleUploadCustomImage}
        />
      )}

      {showPdfSettings && (
        <PdfSettingsModal
          onGenerate={handleGeneratePdf}
          onCancel={() => setShowPdfSettings(false)}
        />
      )}
    </div>
  );
}

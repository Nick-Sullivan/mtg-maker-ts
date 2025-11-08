import { useState } from "react";
import { generatePdfWithImages } from "../functions/generatePdf";
import { DeckWithMetadata, StatusType } from "../types";

export function usePdfGeneration(
  currentDeck: DeckWithMetadata | null,
  setStatus: React.Dispatch<
    React.SetStateAction<{ message: string; type: StatusType }>
  >
) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);

  const handleShowPdfSettings = () => {
    if (!currentDeck) {
      setStatus({ message: "Please load card art first!", type: "error" });
      return;
    }
    setShowPdfSettings(true);
  };

  const handleGeneratePdf = async (spacing: number) => {
    setShowPdfSettings(false);
    setIsGeneratingPdf(true);
    try {
      await generatePdfWithImages(currentDeck!, spacing);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setStatus({
        message: "Error generating PDF. Please try again.",
        type: "error",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return {
    isGeneratingPdf,
    showPdfSettings,
    setShowPdfSettings,
    handleShowPdfSettings,
    handleGeneratePdf,
  };
}

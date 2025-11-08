import { jsPDF } from "jspdf";
import { CardWithMetadata, DeckWithMetadata } from "../types";
import { getCardImageUrl } from "./fetchCardArt";

// Standard MTG card size in inches
const CARD_WIDTH_INCHES = 2.5;
const CARD_HEIGHT_INCHES = 3.5;

// A4 page dimensions in mm
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

// Convert inches to mm (1 inch = 25.4 mm)
const CARD_WIDTH_MM = CARD_WIDTH_INCHES * 25.4;
const CARD_HEIGHT_MM = CARD_HEIGHT_INCHES * 25.4;

// Cards per page (3 columns x 3 rows)
const CARDS_PER_ROW = 3;
const CARDS_PER_COL = 3;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

// CORS proxy for Scryfall images
const CORS_PROXY = "https://corsproxy.io/?";

// Cache for base64 images
const imageCache = new Map<string, string>();

// Helper function to convert image to base64
async function imageToBase64(url: string): Promise<string> {
  // Check cache first
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  // If already a data URL (custom uploaded image), cache and return
  if (url.startsWith("data:")) {
    imageCache.set(url, url);
    return url;
  }

  // Load image through CORS proxy to avoid tainted canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

        // Cache the result
        imageCache.set(url, dataUrl);
        resolve(dataUrl);
      } catch (error) {
        reject(new Error(`Failed to convert image to base64: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    // Use CORS proxy for Scryfall images
    if (url.includes("scryfall.io")) {
      img.src = CORS_PROXY + encodeURIComponent(url);
    } else {
      img.src = url;
    }
  });
}

// Helper function to detect image format from data URL
function getImageFormat(imageUrl: string): string {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/data:image\/([^;]+)/);
    if (match) {
      const format = match[1].toUpperCase();
      if (format === "JPG") return "JPEG";
      return format;
    }
  }
  return "JPEG";
}

export const generatePdfWithImages = async (
  deck: DeckWithMetadata,
  spacing: number = 0.2
): Promise<void> => {
  if (deck.numCards === 0) {
    throw new Error("No cards to generate PDF");
  }

  // Clear cache at the start of PDF generation
  imageCache.clear();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Expand cards array based on quantity
  const expandedCards: CardWithMetadata[] = [];
  deck.cards.forEach((card) => {
    for (let i = 0; i < card.quantity; i++) {
      expandedCards.push(card);
    }
  });

  // Calculate total width/height including spacing
  const TOTAL_CARDS_WIDTH =
    CARD_WIDTH_MM * CARDS_PER_ROW + spacing * (CARDS_PER_ROW - 1);
  const TOTAL_CARDS_HEIGHT =
    CARD_HEIGHT_MM * CARDS_PER_COL + spacing * (CARDS_PER_COL - 1);
  const MARGIN_X = (PAGE_WIDTH_MM - TOTAL_CARDS_WIDTH) / 2;
  const MARGIN_Y = (PAGE_HEIGHT_MM - TOTAL_CARDS_HEIGHT) / 2;

  // Calculate total pages
  const totalPages = Math.ceil(expandedCards.length / CARDS_PER_PAGE);

  let cardIndex = 0;
  let pageNumber = 0;

  while (cardIndex < expandedCards.length) {
    if (pageNumber > 0) {
      doc.addPage();
    }

    // Draw cards for this page
    for (
      let row = 0;
      row < CARDS_PER_COL && cardIndex < expandedCards.length;
      row++
    ) {
      for (
        let col = 0;
        col < CARDS_PER_ROW && cardIndex < expandedCards.length;
        col++
      ) {
        const card = expandedCards[cardIndex];
        const imageUrl = getCardImageUrl(card);

        const x = MARGIN_X + col * (CARD_WIDTH_MM + spacing);
        const y = MARGIN_Y + row * (CARD_HEIGHT_MM + spacing);

        if (imageUrl) {
          try {
            // Convert image to base64 (cached if already loaded)
            const base64Image = await imageToBase64(imageUrl);
            const imageFormat = getImageFormat(base64Image);

            // Add the image to the PDF with correct format
            doc.addImage(
              base64Image,
              imageFormat,
              x,
              y,
              CARD_WIDTH_MM,
              CARD_HEIGHT_MM
            );
          } catch (error) {
            console.error(`Failed to add image for ${card.name}:`, error);
            // Draw placeholder if image fails
            drawPlaceholder(doc, x, y, card.name);
          }
        } else {
          // Draw placeholder for cards without images
          drawPlaceholder(doc, x, y, card.name);
        }

        // Draw cut lines (very light gray)
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);

        cardIndex++;
      }
    }

    // Add page number at the bottom
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageText = `Page ${pageNumber + 1} of ${totalPages}`;
    doc.text(pageText, PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM - 5, {
      align: "center",
    });

    pageNumber++;
  }

  // Save the PDF
  const filename = `mtg-cards-${new Date().getTime()}.pdf`;
  doc.save(filename);

  // Clear cache after PDF generation to free memory
  imageCache.clear();
};

function drawPlaceholder(
  doc: jsPDF,
  x: number,
  y: number,
  cardName: string
): void {
  // Draw gray background
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, "F");

  // Draw border
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);

  // Add text
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  // Wrap text if too long
  const maxWidth = CARD_WIDTH_MM - 10;
  const lines = doc.splitTextToSize(cardName, maxWidth);

  const textX = x + CARD_WIDTH_MM / 2;
  const textY = y + CARD_HEIGHT_MM / 2;

  doc.text(lines, textX, textY, { align: "center", baseline: "middle" });
}

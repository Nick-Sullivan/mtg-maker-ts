import { useEffect, useRef, useState } from "react";
import { getCardImageUrl } from "../../functions/fetchCardArt";
import { CardWithMetadata } from "../../types";
import { ImageCropper } from "../ImageCropper/ImageCropper";
import "./CardArtModal.css";

interface Params {
  card: CardWithMetadata;
  onClose: () => void;
  onSelectPrinting: (index: number) => void;
  onUploadCustomImage: (imageUrl: string) => void;
}

export function CardArtModal({
  card,
  onClose,
  onSelectPrinting,
  onUploadCustomImage,
}: Params) {
  const currentPrinting = card.allPrintings[card.selectedIndex];
  const imageUrl = getCardImageUrl(card);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imageToCrop) return; // Don't handle keys when cropper is open

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [card.selectedIndex, card.allPrintings.length, imageToCrop]);

  const handlePrevious = () => {
    const newIndex =
      card.selectedIndex === 0
        ? card.allPrintings.length - 1
        : card.selectedIndex - 1;
    onSelectPrinting(newIndex);
  };

  const handleNext = () => {
    const newIndex = (card.selectedIndex + 1) % card.allPrintings.length;
    onSelectPrinting(newIndex);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsUploading(true);

    try {
      // Convert image to data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageToCrop(dataUrl);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read image file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      setIsUploading(false);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    onUploadCustomImage(croppedImageUrl);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
  };

  const handleClearCustomImage = () => {
    onUploadCustomImage("");
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>
            ×
          </button>

          <div className="modal-header">
            <h2>
              {card.quantity}x {card.name}
            </h2>
            <p className="modal-subtitle">
              {card.customImageUrl
                ? "Custom image"
                : `Showing ${card.selectedIndex + 1} of ${
                    card.allPrintings.length
                  } printings`}
            </p>
          </div>

          <div className="modal-body">
            {!card.customImageUrl && card.allPrintings.length > 1 && (
              <button
                className="modal-nav-btn modal-nav-left"
                onClick={handlePrevious}
                title="Previous printing (Left Arrow)"
              >
                ‹
              </button>
            )}

            <div className="modal-image-container">
              {imageUrl ? (
                <img src={imageUrl} alt={card.name} />
              ) : (
                <div className="modal-no-image">No image available</div>
              )}

              <div className="modal-card-info">
                {card.customImageUrl ? (
                  <div className="modal-set-info">
                    <strong>Custom Image</strong>
                    <button
                      className="btn-clear-custom"
                      onClick={handleClearCustomImage}
                      title="Remove custom image"
                    >
                      Use Scryfall Images
                    </button>
                  </div>
                ) : (
                  <div className="modal-set-info">
                    <strong>
                      {currentPrinting.set_name ||
                        currentPrinting.set.toUpperCase()}
                    </strong>
                    <span>
                      {" "}
                      ({currentPrinting.set.toUpperCase()} #
                      {currentPrinting.collector_number})
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-upload-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  className="btn-upload"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "📤 Upload Custom Image"}
                </button>
              </div>
            </div>

            {!card.customImageUrl && card.allPrintings.length > 1 && (
              <button
                className="modal-nav-btn modal-nav-right"
                onClick={handleNext}
                title="Next printing (Right Arrow)"
              >
                ›
              </button>
            )}
          </div>

          {!card.customImageUrl && (
            <div className="modal-footer">
              <div className="modal-thumbnails">
                {card.allPrintings.map((printing, index) => {
                  const tempCard: CardWithMetadata = {
                    ...card,
                    selectedIndex: index,
                  };
                  const thumbUrl = getCardImageUrl(tempCard);

                  return (
                    <div
                      key={printing.id || index}
                      className={`modal-thumbnail ${
                        index === card.selectedIndex ? "active" : ""
                      }`}
                      onClick={() => onSelectPrinting(index)}
                      title={`${
                        printing.set_name || printing.set.toUpperCase()
                      } #${printing.collector_number}`}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`${printing.set} ${printing.collector_number}`}
                        />
                      ) : (
                        <div className="modal-thumbnail-placeholder">?</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {imageToCrop && (
        <ImageCropper
          imageUrl={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}

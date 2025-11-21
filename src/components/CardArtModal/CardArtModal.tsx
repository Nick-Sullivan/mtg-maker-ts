import { useEffect, useRef, useState } from "react";
import { getPrintingImageUrls } from "../../functions/scryfall/fetchCardArt";
import { CardWithMetadata } from "../../types";
import { ImageCropper } from "../ImageCropper/ImageCropper";
import "./CardArtModal.css";

interface Params {
  card: CardWithMetadata;
  onClose: () => void;
  onSelectPrinting: (index: number) => void;
  onUploadCustomImage: (imageUrl: string, faceIndex?: number) => void;
}

export function CardArtModal({
  card,
  onClose,
  onSelectPrinting,
  onUploadCustomImage,
}: Params) {
  const currentPrinting = card.allPrintings[card.selectedIndex];
  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploadingFaceIndex, setUploadingFaceIndex] = useState<
    number | undefined
  >(undefined);

  // Check if this card originally was double-faced (from Scryfall data)
  const isOriginallyDoubleFaced =
    currentPrinting?.card_faces && currentPrinting.card_faces.length > 1;

  // Check if we should show custom image controls
  const hasCustomImageSingleFaced =
    !isOriginallyDoubleFaced && !!card.customImageUrl;

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

  const handleUploadClick = (faceIndex?: number) => {
    setUploadingFaceIndex(faceIndex);
    if (faceIndex === 0) {
      fileInputFrontRef.current?.click();
    } else if (faceIndex === 1) {
      fileInputBackRef.current?.click();
    } else {
      fileInputFrontRef.current?.click();
    }
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
    onUploadCustomImage(croppedImageUrl, uploadingFaceIndex);
    setImageToCrop(null);
    setUploadingFaceIndex(undefined);
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
    setUploadingFaceIndex(undefined);
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
              {hasCustomImageSingleFaced
                ? "Custom image"
                : `Showing ${card.selectedIndex + 1} of ${
                    card.allPrintings.length
                  } printings${
                    isOriginallyDoubleFaced ? " (Double-faced card)" : ""
                  }`}
            </p>
          </div>

          <div className="modal-body">
            {!hasCustomImageSingleFaced && card.allPrintings.length > 1 && (
              <button
                className="modal-nav-btn modal-nav-left"
                onClick={handlePrevious}
                title="Previous printing (Left Arrow)"
              >
                ‹
              </button>
            )}

            <div className="modal-image-container">
              {card.imageUrls.length > 0 ? (
                <div
                  className={`modal-image-wrapper ${
                    card.isDoubleFaced ? "double-faced" : ""
                  }`}
                >
                  {card.imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${card.name} face ${index + 1}`}
                      className={card.isDoubleFaced ? "card-face" : ""}
                    />
                  ))}
                </div>
              ) : (
                <div className="modal-no-image">No image available</div>
              )}

              <div className="modal-card-info">
                {hasCustomImageSingleFaced ? (
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
                {isOriginallyDoubleFaced ? (
                  // Two upload buttons for double-faced cards (always show for double-faced)
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      ref={fileInputFrontRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <input
                      ref={fileInputBackRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <button
                      className="btn-upload"
                      onClick={() => handleUploadClick(0)}
                      disabled={isUploading}
                    >
                      {isUploading && uploadingFaceIndex === 0
                        ? "Uploading..."
                        : "📤 Upload Front Face"}
                    </button>
                    <button
                      className="btn-upload"
                      onClick={() => handleUploadClick(1)}
                      disabled={isUploading}
                    >
                      {isUploading && uploadingFaceIndex === 1
                        ? "Uploading..."
                        : "📤 Upload Back Face"}
                    </button>
                  </div>
                ) : (
                  // Single upload button for single-faced cards
                  <>
                    <input
                      ref={fileInputFrontRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <button
                      className="btn-upload"
                      onClick={() => handleUploadClick()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "📤 Upload Custom Image"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {!hasCustomImageSingleFaced && card.allPrintings.length > 1 && (
              <button
                className="modal-nav-btn modal-nav-right"
                onClick={handleNext}
                title="Next printing (Right Arrow)"
              >
                ›
              </button>
            )}
          </div>

          {!hasCustomImageSingleFaced && (
            <div className="modal-footer">
              <div className="modal-thumbnails">
                {card.allPrintings.map((printing, index) => {
                  const {
                    imageUrls: thumbUrls,
                    isDoubleFaced: isThumbDoubleFaced,
                  } = getPrintingImageUrls(printing);

                  return (
                    <div
                      key={printing.id || index}
                      className={`modal-thumbnail ${
                        index === card.selectedIndex ? "active" : ""
                      } ${isThumbDoubleFaced ? "double-faced" : ""}`}
                      onClick={() => onSelectPrinting(index)}
                      title={`${
                        printing.set_name || printing.set.toUpperCase()
                      } #${printing.collector_number}`}
                    >
                      {thumbUrls.length > 0 ? (
                        isThumbDoubleFaced ? (
                          <div className="thumbnail-double-wrapper">
                            {thumbUrls.map((url, faceIndex) => (
                              <img
                                key={faceIndex}
                                src={url}
                                alt={`${printing.set} ${
                                  printing.collector_number
                                } face ${faceIndex + 1}`}
                                className="thumbnail-face"
                              />
                            ))}
                          </div>
                        ) : (
                          <img
                            src={thumbUrls[0]}
                            alt={`${printing.set} ${printing.collector_number}`}
                          />
                        )
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

import { useEffect, useRef, useState } from "react";
import "./ImageCropper.css";

interface Params {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

const CARD_ASPECT_RATIO = 5 / 7; // MTG card aspect ratio (2.5" x 3.5")

export function ImageCropper({ imageUrl, onCropComplete, onCancel }: Params) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;

      // Auto-crop to the largest possible card-sized area
      const imageAspectRatio = img.width / img.height;
      let cropWidth, cropHeight, cropX, cropY;

      if (imageAspectRatio > CARD_ASPECT_RATIO) {
        // Image is wider than card ratio - height is the constraint
        cropHeight = img.height;
        cropWidth = cropHeight * CARD_ASPECT_RATIO;
        cropX = (img.width - cropWidth) / 2;
        cropY = 0;
      } else {
        // Image is taller than card ratio - width is the constraint
        cropWidth = img.width;
        cropHeight = cropWidth / CARD_ASPECT_RATIO;
        cropX = 0;
        cropY = (img.height - cropHeight) / 2;
      }

      // Create cropped image
      const cropCanvas = document.createElement("canvas");
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) return;

      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImageUrl = cropCanvas.toDataURL("image/png");
      setIsProcessing(false);
      onCropComplete(croppedImageUrl);
    };

    img.onerror = () => {
      setIsProcessing(false);
      alert("Failed to load image");
      onCancel();
    };

    img.src = imageUrl;
  }, [imageUrl, onCropComplete, onCancel]);

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="image-cropper-header">
          <h3>Processing Image</h3>
          <p>Automatically cropping to card size...</p>
        </div>

        <div className="image-cropper-canvas-container">
          <div className="image-cropper-loading">
            {isProcessing ? "Cropping image..." : "Complete!"}
          </div>
        </div>
      </div>
    </div>
  );
}

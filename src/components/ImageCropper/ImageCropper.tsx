import { useEffect, useRef, useState } from "react";
import "./ImageCropper.css";

interface Params {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

const CARD_ASPECT_RATIO = 5 / 7; // MTG card aspect ratio (2.5" x 3.5")

type ResizeHandle = "tl" | "tr" | "bl" | "br" | null;

export function ImageCropper({ imageUrl, onCropComplete, onCancel }: Params) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Initialize crop to maximum size with card aspect ratio
      const imageAspectRatio = img.width / img.height;

      let cropWidth, cropHeight;

      if (imageAspectRatio > CARD_ASPECT_RATIO) {
        // Image is wider than card ratio - height is the constraint
        cropHeight = img.height;
        cropWidth = cropHeight * CARD_ASPECT_RATIO;
      } else {
        // Image is taller than card ratio - width is the constraint
        cropWidth = img.width;
        cropHeight = cropWidth / CARD_ASPECT_RATIO;
      }

      setCrop({
        x: (img.width - cropWidth) / 2,
        y: (img.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw overlay (darken areas outside crop)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      crop.x,
      crop.y,
      crop.width,
      crop.height
    );

    // Draw crop border
    ctx.strokeStyle = "#667eea";
    ctx.lineWidth = 3;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw corner handles
    const handleSize = 24;
    ctx.fillStyle = "#667eea";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    const corners = [
      { x: crop.x, y: crop.y },
      { x: crop.x + crop.width, y: crop.y },
      { x: crop.x, y: crop.y + crop.height },
      { x: crop.x + crop.width, y: crop.y + crop.height },
    ];

    corners.forEach((corner) => {
      ctx.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }, [crop, imageLoaded]);

  const getResizeHandle = (x: number, y: number): ResizeHandle => {
    const handleSize = 24;
    const tolerance = handleSize / 2;

    // Check each corner
    if (Math.abs(x - crop.x) < tolerance && Math.abs(y - crop.y) < tolerance)
      return "tl";
    if (
      Math.abs(x - (crop.x + crop.width)) < tolerance &&
      Math.abs(y - crop.y) < tolerance
    )
      return "tr";
    if (
      Math.abs(x - crop.x) < tolerance &&
      Math.abs(y - (crop.y + crop.height)) < tolerance
    )
      return "bl";
    if (
      Math.abs(x - (crop.x + crop.width)) < tolerance &&
      Math.abs(y - (crop.y + crop.height)) < tolerance
    )
      return "br";

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on a resize handle
    const handle = getResizeHandle(x, y);
    if (handle) {
      setIsResizing(handle);
      setDragStart({ x, y });
      return;
    }

    // Check if clicking inside crop area for dragging
    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - crop.x, y: y - crop.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Update cursor based on position
    if (!isDragging && !isResizing) {
      const handle = getResizeHandle(x, y);
      if (handle === "tl" || handle === "br") {
        canvas.style.cursor = "nwse-resize";
      } else if (handle === "tr" || handle === "bl") {
        canvas.style.cursor = "nesw-resize";
      } else if (
        x >= crop.x &&
        x <= crop.x + crop.width &&
        y >= crop.y &&
        y <= crop.y + crop.height
      ) {
        canvas.style.cursor = "move";
      } else {
        canvas.style.cursor = "default";
      }
    }

    if (isResizing && imageRef.current) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      let newCrop = { ...crop };

      switch (isResizing) {
        case "br": {
          // Bottom-right: expand from top-left anchor
          const newWidth = crop.width + dx;
          const newHeight = newWidth / CARD_ASPECT_RATIO;

          if (
            newWidth > 50 &&
            newHeight > 50 &&
            crop.x + newWidth <= imageRef.current.width &&
            crop.y + newHeight <= imageRef.current.height
          ) {
            newCrop.width = newWidth;
            newCrop.height = newHeight;
            setDragStart({ x, y });
          }
          break;
        }
        case "bl": {
          // Bottom-left: expand from top-right anchor
          const newWidth = crop.width - dx;
          const newHeight = newWidth / CARD_ASPECT_RATIO;

          if (
            newWidth > 50 &&
            newHeight > 50 &&
            crop.x + dx >= 0 &&
            crop.y + newHeight <= imageRef.current.height
          ) {
            newCrop.x = crop.x + dx;
            newCrop.width = newWidth;
            newCrop.height = newHeight;
            setDragStart({ x, y });
          }
          break;
        }
        case "tr": {
          // Top-right: expand from bottom-left anchor
          const newWidth = crop.width + dx;
          const newHeight = newWidth / CARD_ASPECT_RATIO;
          const heightDiff = newHeight - crop.height;

          if (
            newWidth > 50 &&
            newHeight > 50 &&
            crop.x + newWidth <= imageRef.current.width &&
            crop.y - heightDiff >= 0
          ) {
            newCrop.y = crop.y - heightDiff;
            newCrop.width = newWidth;
            newCrop.height = newHeight;
            setDragStart({ x, y });
          }
          break;
        }
        case "tl": {
          // Top-left: expand from bottom-right anchor
          const newWidth = crop.width - dx;
          const newHeight = newWidth / CARD_ASPECT_RATIO;
          const heightDiff = newHeight - crop.height;

          if (
            newWidth > 50 &&
            newHeight > 50 &&
            crop.x + dx >= 0 &&
            crop.y - heightDiff >= 0
          ) {
            newCrop.x = crop.x + dx;
            newCrop.y = crop.y - heightDiff;
            newCrop.width = newWidth;
            newCrop.height = newHeight;
            setDragStart({ x, y });
          }
          break;
        }
      }

      setCrop(newCrop);
    } else if (isDragging && imageRef.current) {
      let newX = x - dragStart.x;
      let newY = y - dragStart.y;

      // Keep crop within image bounds
      newX = Math.max(0, Math.min(newX, imageRef.current.width - crop.width));
      newY = Math.max(0, Math.min(newY, imageRef.current.height - crop.height));

      setCrop({ ...crop, x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
  };

  const handleCropConfirm = () => {
    if (!imageRef.current) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement("canvas");
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    cropCanvas.width = crop.width;
    cropCanvas.height = crop.height;

    ctx.drawImage(
      imageRef.current,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    const croppedImageUrl = cropCanvas.toDataURL("image/png");
    onCropComplete(croppedImageUrl);
  };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="image-cropper-header">
          <h3>Crop Image to Card Size</h3>
          <p>Drag to reposition. Drag corners to resize.</p>
        </div>

        <div className="image-cropper-canvas-container">
          {imageLoaded ? (
            <canvas
              ref={canvasRef}
              className="image-cropper-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          ) : (
            <div className="image-cropper-loading">Loading image...</div>
          )}
        </div>

        <div className="image-cropper-actions">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleCropConfirm} className="btn-confirm">
            Use Cropped Image
          </button>
        </div>
      </div>
    </div>
  );
}

import {
  Box,
  Button,
  Center,
  Group,
  Modal,
  Slider,
  Stack,
  Text,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import classes from './ImageCrop.module.css';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropProps {
  imageUrl: string;
  opened: boolean;
  onClose: () => void;
  onCrop: (croppedImageBlob: Blob) => void;
  targetSize?: number;
}

export const ImageCrop: React.FC<ImageCropProps> = ({
  imageUrl,
  opened,
  onClose,
  onCrop,
  targetSize = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  // Load and setup image when modal opens
  useEffect(() => {
    if (opened && imageUrl) {
      const img = new Image();
      img.onload = () => {
        if (imageRef.current) {
          imageRef.current = img;
          setImageLoaded(true);

          // Calculate initial scale and crop area
          const maxCanvasSize = 400;
          const imageAspect = img.width / img.height;

          let canvasWidth, canvasHeight;
          if (imageAspect > 1) {
            canvasWidth = Math.min(maxCanvasSize, img.width);
            canvasHeight = canvasWidth / imageAspect;
          } else {
            canvasHeight = Math.min(maxCanvasSize, img.height);
            canvasWidth = canvasHeight * imageAspect;
          }

          setCanvasSize({ width: canvasWidth, height: canvasHeight });

          // Initial crop area in the center
          const cropSize = Math.min(canvasWidth, canvasHeight) * 0.8;
          setCropArea({
            x: (canvasWidth - cropSize) / 2,
            y: (canvasHeight - cropSize) / 2,
            width: cropSize,
            height: cropSize,
          });
        }
      };
      img.src = imageUrl;
      imageRef.current = img;
    }
  }, [opened, imageUrl]);

  // Draw on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image scaled to fit canvas
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);

    // Draw overlay (darken areas outside crop)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear the crop area (make it bright)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw crop border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    const corners = [
      { x: cropArea.x - handleSize / 2, y: cropArea.y - handleSize / 2 },
      {
        x: cropArea.x + cropArea.width - handleSize / 2,
        y: cropArea.y - handleSize / 2,
      },
      {
        x: cropArea.x - handleSize / 2,
        y: cropArea.y + cropArea.height - handleSize / 2,
      },
      {
        x: cropArea.x + cropArea.width - handleSize / 2,
        y: cropArea.y + cropArea.height - handleSize / 2,
      },
    ];

    corners.forEach((corner) => {
      ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
    });
  }, [cropArea, canvasSize, imageLoaded]);

  // Redraw when crop area changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking inside crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = Math.max(
      0,
      Math.min(x - dragStart.x, canvasSize.width - cropArea.width)
    );
    const newY = Math.max(
      0,
      Math.min(y - dragStart.y, canvasSize.height - cropArea.height)
    );

    setCropArea((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Crop size slider handler
  const handleSizeChange = (newSize: number) => {
    const maxSize = Math.min(canvasSize.width, canvasSize.height);
    const size = (newSize / 100) * maxSize;

    // Keep crop area centered when resizing
    const centerX = cropArea.x + cropArea.width / 2;
    const centerY = cropArea.y + cropArea.height / 2;

    const newX = Math.max(
      0,
      Math.min(centerX - size / 2, canvasSize.width - size)
    );
    const newY = Math.max(
      0,
      Math.min(centerY - size / 2, canvasSize.height - size)
    );

    setCropArea({
      x: newX,
      y: newY,
      width: size,
      height: size,
    });
  };

  // Extract cropped image
  const handleCrop = async () => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = targetSize;
    cropCanvas.height = targetSize;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    // Calculate the crop area in original image coordinates
    const scaleX = img.width / canvasSize.width;
    const scaleY = img.height / canvasSize.height;

    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Draw the cropped portion to the target size
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetSize,
      targetSize
    );

    // Convert to blob
    cropCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
          onClose();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const currentSizePercent = imageLoaded
    ? Math.round(
        (cropArea.width / Math.min(canvasSize.width, canvasSize.height)) * 100
      )
    : 50;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Crop Image'
      size='lg'
      centered
    >
      <Stack gap='md'>
        <Text size='sm' c='dimmed'>
          Drag the crop area to move it. Use the slider to adjust the size. The
          image will be resized to {targetSize}x{targetSize}px.
        </Text>

        <Center>
          <Box className={classes.cropContainer}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`${classes.cropCanvas} ${
                isDragging ? classes.cropCanvasGrabbing : classes.cropCanvasGrab
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </Box>
        </Center>

        <Box>
          <Text size='sm' mb='xs'>
            Crop Size: {currentSizePercent}%
          </Text>
          <Slider
            value={currentSizePercent}
            onChange={handleSizeChange}
            min={20}
            max={100}
            step={5}
            marks={[
              { value: 20, label: '20%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
            ]}
          />
        </Box>

        <Group justify='flex-end' gap='sm'>
          <Button
            variant='light'
            color='gray'
            leftSection={<IconX size={16} />}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleCrop}
            disabled={!imageLoaded}
          >
            Apply Crop
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

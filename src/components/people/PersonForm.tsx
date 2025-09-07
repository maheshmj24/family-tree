import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import { usePhoto } from '../../hooks/usePhoto';
import { usePhotoContext } from '../../hooks/usePhotoContext';
import type { Person } from '../../types/models';
import { deletePhoto, forceReloadPhoto } from '../../utils/photo-loader';
import { PHOTO_CONFIG, PhotoProcessor } from '../../utils/photo-processor';
import { ImageCrop } from '../common/ImageCrop';

type Props = {
  onSubmit: (person: Person) => Promise<void>;
  initial?: Person | null;
  onCancel?: () => void;
  open?: boolean;
};

export default function PersonForm({
  onSubmit,
  initial,
  onCancel,
  open = true,
}: Readonly<Props>) {
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<string>('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [alive, setAlive] = useState<boolean>(true);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    undefined
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string>('');

  // Use the photo hook to get the proper photo URL for existing avatars
  const { photoUrl } = usePhoto(initial?.avatar);

  // Get photo context for cache invalidation
  const { invalidatePhoto } = usePhotoContext();

  // Set the image data URL when photo loads
  useEffect(() => {
    if (photoUrl && !selectedFile) {
      setImageDataUrl(photoUrl);
    }
  }, [photoUrl, selectedFile]);

  // Reset form when modal opens for a new person
  useEffect(() => {
    if (open && !initial) {
      // Reset all form fields for new person
      setFullName('');
      setNickname('');
      setGender('');
      setBirthDate('');
      setDeathDate('');
      setAlive(true);
      setImageDataUrl(undefined);
      setSelectedFile(null);
      setIsSubmitting(false);
      setShowCropModal(false);
      setCropImageUrl('');
    } else if (open && initial) {
      // Set form fields when editing existing person
      setFullName(initial.fullName ?? initial.displayName ?? '');
      setNickname(initial.nickname ?? '');
      setGender(initial.gender ?? '');
      setBirthDate(initial.birthDate ?? '');
      setDeathDate(initial.deathDate ?? '');
      setAlive(initial.alive ?? true);
    }
  }, [open, initial]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create image URL for crop modal
    const imageUrl = URL.createObjectURL(file);
    setCropImageUrl(imageUrl);
    setShowCropModal(true);
  };

  const handleCrop = (croppedBlob: Blob) => {
    // Create a File object from the cropped blob
    const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
      type: 'image/jpeg',
    });

    // Store the cropped file for processing during submit
    setSelectedFile(croppedFile);

    // Create preview from the cropped blob
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(croppedBlob);

    // Clean up the crop image URL
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl('');
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl('');
    }
  };

  const clearPhoto = () => {
    setImageDataUrl(undefined);
    setSelectedFile(null);
  };

  const deleteExistingPhoto = async () => {
    if (!initial?.avatar) return;

    try {
      await deletePhoto(initial.avatar);
      setImageDataUrl(undefined);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use existing ID if editing, otherwise generate new one
      const id =
        initial?.id ||
        (window.crypto && (window.crypto as any).randomUUID
          ? (window.crypto as any).randomUUID()
          : Date.now().toString(36) + Math.random().toString(36).slice(2));

      const now = new Date().toISOString();

      let avatarPath = initial?.avatar; // Keep existing avatar if no new file

      // Process new photo if one was selected
      if (selectedFile) {
        const processor = new PhotoProcessor();
        const result = await processor.processUploadedFile(selectedFile, id);

        if (result.success && result.avatarPath) {
          // If updating an existing person's photo, clear the old photo from cache
          if (initial?.avatar && initial.avatar !== result.avatarPath) {
            forceReloadPhoto(initial.avatar);
            invalidatePhoto(initial.avatar);
          }
          avatarPath = result.avatarPath;

          // Force reload the new photo path to ensure fresh cache
          if (avatarPath) {
            forceReloadPhoto(avatarPath);
            invalidatePhoto(avatarPath);
          }
        } else {
          // Show error but don't prevent form submission
          console.error('Photo processing failed:', result.error);
          alert(`Photo processing failed: ${result.error}`);
        }
      } else if (!imageDataUrl && initial?.avatar) {
        // Photo was cleared/deleted from form, remove from person record
        avatarPath = undefined;
      }

      const person: Person = {
        id,
        displayName: fullName || nickname || 'Unnamed',
        fullName: fullName || undefined,
        nickname: nickname || undefined,
        gender: (gender as 'male' | 'female' | 'other') || undefined,
        birthDate: birthDate || undefined,
        deathDate: alive ? undefined : deathDate || undefined,
        alive: alive,
        avatar: avatarPath,
        createdAt: initial?.createdAt || now,
        updatedAt: now,
      };

      await onSubmit(person);
    } catch (error) {
      console.error('Form submission failed:', error);
      alert(
        `Form submission failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoRequirementsText = `Up to ${PHOTO_CONFIG.targetWidth}x${PHOTO_CONFIG.targetHeight}px, max ${PHOTO_CONFIG.maxOriginalSizeMB}MB, JPEG/PNG/WebP formats`;

  return (
    <Modal
      opened={open}
      onClose={onCancel || (() => {})}
      title={initial ? 'Edit Person' : 'Add New Person'}
      size='md'
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap='lg'>
          {/* Header with photo and primary info */}
          <Card withBorder>
            <Flex gap='md' align='flex-start'>
              {/* Photo section */}
              <Box style={{ flexShrink: 0 }}>
                <Stack gap='xs' align='center'>
                  <Tooltip
                    label={`Photo requirements: ${photoRequirementsText}`}
                    multiline
                  >
                    <Avatar
                      src={imageDataUrl}
                      size={80}
                      radius='md'
                      style={{ cursor: 'help' }}
                    >
                      {(fullName || nickname)
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || '?'}
                    </Avatar>
                  </Tooltip>

                  <Group gap='xs'>
                    <input
                      id='person-image-input'
                      type='file'
                      accept='image/*'
                      onChange={handleFile}
                      hidden
                      aria-label='Upload photo'
                    />
                    <Tooltip label='Upload photo'>
                      <ActionIcon
                        variant='light'
                        size='sm'
                        onClick={() =>
                          document.getElementById('person-image-input')?.click()
                        }
                      >
                        <IconUpload size={14} />
                      </ActionIcon>
                    </Tooltip>

                    {imageDataUrl && (
                      <Tooltip label='Clear photo'>
                        <ActionIcon
                          variant='light'
                          color='gray'
                          size='sm'
                          onClick={clearPhoto}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}

                    {initial?.avatar && imageDataUrl === photoUrl && (
                      <Tooltip label='Delete photo permanently'>
                        <ActionIcon
                          variant='light'
                          color='red'
                          size='sm'
                          onClick={deleteExistingPhoto}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Stack>
              </Box>

              {/* Primary info section */}
              <Box style={{ flex: 1 }}>
                <Stack gap='sm'>
                  <TextInput
                    label='Full Name'
                    value={fullName}
                    onChange={(e) => setFullName(e.currentTarget.value)}
                    required
                    placeholder='Complete name of the person'
                  />

                  <TextInput
                    label='Nickname'
                    value={nickname}
                    onChange={(e) => setNickname(e.currentTarget.value)}
                    placeholder='How they are commonly known'
                  />

                  <Select
                    label='Gender'
                    value={gender}
                    onChange={(value) => setGender(value || '')}
                    placeholder='Select gender'
                    data={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                    clearable
                  />
                </Stack>
              </Box>
            </Flex>
          </Card>

          {/* Life Information */}
          <Card withBorder>
            <Card.Section withBorder inheritPadding py='sm'>
              <Text fw={600}>Life Information</Text>
            </Card.Section>
            <Card.Section inheritPadding py='md'>
              <Stack gap='sm'>
                <TextInput
                  label='Birth Date'
                  type='date'
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.currentTarget.value)}
                  description='Age will be calculated automatically from this'
                />

                <Checkbox
                  label='Person is alive'
                  checked={alive}
                  onChange={(e) => setAlive(e.currentTarget.checked)}
                />

                {!alive && (
                  <TextInput
                    label='Death Date'
                    type='date'
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.currentTarget.value)}
                    description='Date of passing'
                  />
                )}
              </Stack>
            </Card.Section>
          </Card>

          {/* Form actions */}
          <Group justify='flex-end' gap='sm'>
            {onCancel && (
              <Button variant='outline' onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              loading={isSubmitting}
              disabled={!fullName.trim()}
            >
              {initial ? 'Update' : 'Add'} Person
            </Button>
          </Group>
        </Stack>
      </form>

      {/* Image Crop Modal */}
      <ImageCrop
        imageUrl={cropImageUrl}
        opened={showCropModal}
        onClose={handleCropCancel}
        onCrop={handleCrop}
        targetSize={PHOTO_CONFIG.targetWidth}
      />
    </Modal>
  );
}

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import ImageCropModal from '@/components/common/ImageCropModal';
import { useUploadAvatar } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AvatarUpload() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${t('notifications.imageTooLarge')} 5MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('notifications.onlyImages'));
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      const file = new File([croppedBlob], 'avatar.webp', {
        type: 'image/webp',
      });

      const result = await uploadAvatar.mutateAsync(file);
      updateUser({ avatar: result.url });
      toast.success(t('notifications.avatarUpdated'));
    } catch (error) {
      toast.error(t('notifications.errorUploading'));
      console.error('Upload error:', error);
    }
  };

  const handleCloseCropModal = () => {
    setIsCropModalOpen(false);
    setImageSrc(null);
  };

  return (
    <>
      <div>
        <label className="label">{t('settings.avatar')}</label>
        <div className="flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="w-20 h-20 rounded-xl bg-background-darker overflow-hidden ring-2 ring-white/10">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                {user?.username?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {uploadAvatar.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {t('settings.changeAvatar')}
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {t('settings.avatarRecommendation')}
        </p>
      </div>

      {/* Crop Modal */}
      {imageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={handleCloseCropModal}
          imageSrc={imageSrc}
          aspect={1}
          onCropComplete={handleCropComplete}
          title={t('settings.avatar')}
        />
      )}
    </>
  );
}

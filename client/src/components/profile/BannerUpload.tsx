import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import ImageCropModal from '@/components/common/ImageCropModal';
import { useUploadBanner } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function BannerUpload() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const uploadBanner = useUploadBanner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB for banner)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${t('notifications.imageTooLarge')} 10MB`);
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
      const file = new File([croppedBlob], 'banner.webp', {
        type: 'image/webp',
      });

      const result = await uploadBanner.mutateAsync(file);
      updateUser({ banner: result.url });
      toast.success(t('notifications.bannerUpdated'));
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
        <label className="label">{t('settings.banner')}</label>
        <div className="relative h-32 rounded-xl bg-background-darker overflow-hidden ring-2 ring-white/10 group">
          {/* Banner Preview */}
          {user?.banner ? (
            <img
              src={user.banner}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-600/30 to-accent-600/30" />
          )}

          {/* Overlay with Upload Button */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadBanner.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {uploadBanner.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {uploadBanner.isPending ? t('common.loading') : t('settings.changeBanner')}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {t('settings.bannerRecommendation')}
        </p>
      </div>

      {/* Crop Modal */}
      {imageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={handleCloseCropModal}
          imageSrc={imageSrc}
          aspect={3}
          onCropComplete={handleCropComplete}
          title={t('settings.banner')}
        />
      )}
    </>
  );
}

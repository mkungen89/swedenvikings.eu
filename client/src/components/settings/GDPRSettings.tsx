import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Shield, Cookie } from 'lucide-react';
import { useCookieConsentStore } from '@/store/cookieConsentStore';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export default function GDPRSettings() {
  const { preferences, consentDate, revokeConsent } = useCookieConsentStore();
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/gdpr/export', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `swedenvikings-data-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(t('gdpr.dataDownloaded'));
    } catch (error) {
      toast.error(t('notifications.errorSaving'));
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error(`${t('gdpr.deleteConfirmation')} "${t('gdpr.deleteConfirmText')}"`);
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete('/gdpr/account', {
        data: { confirmation: deleteConfirmation },
      });

      toast.success(t('gdpr.accountDeleted'));

      // Logout and redirect
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (error: any) {
      toast.error(error?.message || t('notifications.errorSaving'));
      console.error('Delete account error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">{t('gdpr.title')}</h2>

      {/* Cookie Preferences */}
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Cookie className="w-5 h-5 text-primary-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium mb-1">{t('gdpr.cookieSettings')}</h3>
            <p className="text-sm text-gray-400">
              {t('cookie.description')}
            </p>
          </div>
        </div>

        {consentDate && (
          <div className="text-sm text-gray-400 mb-4">
            {t('gdpr.cookieConsent')}: {new Date(consentDate).toLocaleString('sv-SE')}
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
            <span className="text-sm">{t('gdpr.necessaryCookies')}</span>
            <span className="text-xs text-green-400">{t('gdpr.enabled')}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
            <span className="text-sm">{t('gdpr.functionalCookies')}</span>
            <span className={`text-xs ${preferences.functional ? 'text-green-400' : 'text-gray-500'}`}>
              {preferences.functional ? t('gdpr.enabled') : t('gdpr.disabled')}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
            <span className="text-sm">{t('gdpr.analyticsCookies')}</span>
            <span className={`text-xs ${preferences.analytics ? 'text-green-400' : 'text-gray-500'}`}>
              {preferences.analytics ? t('gdpr.enabled') : t('gdpr.disabled')}
            </span>
          </div>
        </div>

        <button
          onClick={revokeConsent}
          className="btn-secondary text-sm"
        >
          {t('gdpr.revokeConsent')}
        </button>
      </div>

      {/* Data Export */}
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Download className="w-5 h-5 text-primary-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium mb-1">{t('gdpr.downloadData')}</h3>
            <p className="text-sm text-gray-400">
              {t('gdpr.downloadDataDesc')}
            </p>
          </div>
        </div>

        <div className="bg-background-darker p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-300 mb-2">
            <strong>{t('gdpr.exportIncludes')}</strong>
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• {t('gdpr.exportProfile')}</li>
            <li>• {t('gdpr.exportActivity')}</li>
            <li>• {t('gdpr.exportStats')}</li>
            <li>• {t('gdpr.exportContent')}</li>
            <li>• {t('gdpr.exportSupport')}</li>
          </ul>
        </div>

        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="btn-primary"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('gdpr.downloading')}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {t('gdpr.downloadButton')}
            </>
          )}
        </button>
      </div>

      {/* Privacy Links */}
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium mb-1">{t('gdpr.privacyDocs')}</h3>
            <p className="text-sm text-gray-400">
              {t('gdpr.privacyDocsDesc')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/privacy" className="btn-secondary text-sm">
            {t('gdpr.privacyPolicy')}
          </a>
          <a href="/terms" className="btn-secondary text-sm">
            {t('gdpr.termsOfService')}
          </a>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="card p-6 border-red-600/20">
        <div className="flex items-start gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-400 mb-1">{t('gdpr.deleteAccount')}</h3>
            <p className="text-sm text-gray-400">
              {t('gdpr.deleteAccountDesc')}
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <>
            <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>{t('gdpr.deleteWarning')}</strong>
                  </p>
                  <p className="text-sm text-gray-400">
                    {t('gdpr.deleteWarningDesc')}
                  </p>
                  <ul className="text-sm text-gray-400 mt-2 space-y-1">
                    <li>• {t('gdpr.deleteProfile')}</li>
                    <li>• {t('gdpr.deleteStats')}</li>
                    <li>• {t('gdpr.deleteContent')}</li>
                    <li>• {t('gdpr.deleteMemberships')}</li>
                    <li>• {t('gdpr.deleteSupport')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              {t('gdpr.deleteButton')}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-3">
                {t('gdpr.deleteConfirmation')} <strong className="text-red-400">{t('gdpr.deleteConfirmText')}</strong> {t('common.or').toLowerCase()}:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={t('gdpr.deleteConfirmText')}
                className="input mb-3"
              />
              <p className="text-xs text-gray-400">
                {t('gdpr.deleteHint')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation('');
                }}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || isDeleting}
                className="btn-danger"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('gdpr.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t('gdpr.deletePermanent')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

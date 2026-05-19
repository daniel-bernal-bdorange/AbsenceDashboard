import { useFolderPicker } from '../fileSystem/useFolderPicker';
import { useTranslation } from '../i18n/useTranslation';

export function FolderPicker() {
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { pickFolder, isLoading, error, folderName } = useFolderPicker();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-8 py-20">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          {tCommon('appName')}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
          {tDashboard('folderPickerTitle')}
        </h1>
        <p className="mt-4 max-w-xl text-base text-gray-500 leading-relaxed">
          {tDashboard('folderPickerDescription')}
        </p>

        {folderName && (
          <div className="mt-6 border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">{folderName}</span>
          </div>
        )}

        <div className="mt-8">
          <button
            className="bg-orangeBusiness px-6 py-3 text-sm font-medium text-white hover:bg-orangeBusiness-dark disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={() => void pickFolder()}
          >
            {isLoading ? tCommon('loading') : tDashboard('selectFolder')}
          </button>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-warning">{error}</p>}
      </div>
    </main>
  );
}
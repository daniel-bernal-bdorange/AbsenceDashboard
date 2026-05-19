import { useFolderPicker } from '../fileSystem/useFolderPicker';
import { useTranslation } from '../i18n/useTranslation';

export function FolderPicker() {
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { pickFolder, isLoading, error, folderName } = useFolderPicker();

  return (
    <main className="min-h-screen bg-orange-radial text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-6 md:px-6 lg:px-8">
        <section className="surface w-full p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orangeBusiness">
            {tCommon('appName')}
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink md:text-4xl">
            {tDashboard('folderPickerTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-muted md:text-base">
            {tDashboard('folderPickerDescription')}
          </p>

          {folderName ? (
            <p className="mt-4 rounded-2xl border border-orangeBusiness-pale bg-orangeBusiness-pale px-4 py-3 text-sm font-medium text-ink">
              {folderName}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-orangeBusiness px-5 py-2.5 font-medium text-white transition hover:bg-orangeBusiness-dark disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isLoading}
              onClick={() => void pickFolder()}
            >
              {isLoading ? tCommon('loading') : tDashboard('selectFolder')}
            </button>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-warning">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
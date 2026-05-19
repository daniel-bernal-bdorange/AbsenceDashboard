/// <reference types="vite/client" />

interface DirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle]>;
  values(): AsyncIterableIterator<FileSystemFileHandle>;
}

interface Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
}

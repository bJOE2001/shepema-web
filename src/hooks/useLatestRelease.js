import { useState, useEffect, useCallback } from 'react';
import { getLatestRelease, recordDownload, FALLBACK_RELEASE } from '../lib/supabase';

export function useLatestRelease() {
  const [release, setRelease] = useState(FALLBACK_RELEASE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRelease = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLatestRelease();
      if (data) {
        setRelease(data);
      }
    } catch (err) {
      console.warn('Could not fetch latest release:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelease();
  }, [fetchRelease]);

  const handleDownloadClick = useCallback(
    (e) => {
      if (release?.id) {
        recordDownload(release.id);
      }
    },
    [release]
  );

  return {
    release,
    loading,
    error,
    refresh: fetchRelease,
    handleDownloadClick,
    apkUrl: release?.apk_url || FALLBACK_RELEASE.apk_url,
    version: release?.version || FALLBACK_RELEASE.version,
    fileSize: release?.apk_size_formatted || FALLBACK_RELEASE.apk_size_formatted,
    releaseNotes: release?.release_notes || FALLBACK_RELEASE.release_notes,
    title: release?.title || FALLBACK_RELEASE.title,
  };
}

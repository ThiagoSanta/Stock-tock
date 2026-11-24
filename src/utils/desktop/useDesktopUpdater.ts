/**
 * Hook para Auto-Actualización de la versión de escritorio (.exe)
 * Consulta en segundo plano contra GitHub Releases y avisa si hay versión nueva.
 */
import { useEffect, useState } from 'react';

const CURRENT_VERSION = '0.1.0';

export function useDesktopUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    // Solo verificar si estamos en entorno Tauri de escritorio
    if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
      return;
    }

    const checkUpdates = async () => {
      try {
        const res = await fetch(
          'https://api.github.com/repos/ThiagoSanta/Stock-tock/releases/latest',
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const latestTag = data.tag_name?.replace(/^v/, '');

        if (latestTag && latestTag !== CURRENT_VERSION) {
          setUpdateAvailable(true);
          setVersion(latestTag);
          console.log(`[Auto-Update] Nueva versión detectada: ${latestTag}`);
        }
      } catch (err) {
        console.debug('[Auto-Update] Verificación silenciosa:', err);
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const relaunch = () => {
    window.open('https://github.com/ThiagoSanta/Stock-tock/releases/latest', '_blank');
  };

  return { updateAvailable, version, relaunch };
}

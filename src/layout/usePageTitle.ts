import { useEffect } from 'react';

const APP_NAME = 'Tamiyo';

export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${APP_NAME} - ${title}` : APP_NAME;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}

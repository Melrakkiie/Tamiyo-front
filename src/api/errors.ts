export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  static from(response: Response, body: unknown): ApiError {
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : response.statusText;
    const retryAfter = Number(response.headers.get('Retry-After'));

    return new ApiError(
      response.status,
      message,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    );
  }
}

const serverErrorMessage = 'Le serveur a rencontré une erreur. Réessaie plus tard.';

const defaultMessages: Partial<Record<number, string>> = {
  400: 'Certaines informations envoyées sont invalides.',
  401: 'Ta session a expiré. Reconnecte-toi.',
  403: "Tu n'as pas accès à cette ressource.",
  404: 'Le service est introuvable pour le moment. Réessaie plus tard.',
  409: 'Cette action entre en conflit avec des données existantes.',
  413: 'Le fichier envoyé est trop volumineux.',
  502: 'Le service est momentanément indisponible. Réessaie dans un instant.',
  503: 'Le service est momentanément indisponible. Réessaie dans un instant.',
};

export function errorMessage(err: unknown, overrides: Partial<Record<number, string>> = {}): string {
  if (err instanceof ApiError) {
    const override = overrides[err.status];
    if (override) {
      return override;
    }
    if (err.status === 429) {
      return err.retryAfterSeconds
        ? `Trop de tentatives. Réessaie dans ${err.retryAfterSeconds} s.`
        : 'Trop de tentatives. Réessaie dans un moment.';
    }
    if (import.meta.env.DEV) {
      console.warn(`API error ${err.status}: ${err.message}`);
    }
    const fallback =
      err.status >= 500 ? serverErrorMessage : `Une erreur est survenue (code ${err.status}).`;
    return defaultMessages[err.status] ?? fallback;
  }

  if (err instanceof TypeError) {
    return 'Impossible de joindre le serveur. Vérifie ta connexion.';
  }

  return 'Une erreur inattendue est survenue.';
}

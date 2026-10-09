export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Тетик';
export const LOCALES = ['ru', 'ky', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

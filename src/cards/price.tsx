import { Text, type TextProps } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { api, unwrap } from '../api/client';
import type { Value } from '../api/types';
import { usePreferences } from '../auth/preferences';
import { useSession } from '../auth/useSession';
import type { ScryfallCard } from '../scryfall/client';
import { useScryfallCard } from '../scryfall/hooks';

export type PriceCurrency = keyof Value;

export function usePriceCurrency(): PriceCurrency | null {
  const { status } = useSession();
  const preferences = usePreferences(status === 'authenticated').data;
  if (status === 'anonymous') {
    return 'eur';
  }
  if (status !== 'authenticated' || !preferences?.show_prices) {
    return null;
  }
  return preferences.price_currency;
}

const formatters: Record<PriceCurrency, Intl.NumberFormat> = {
  eur: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
  usd: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }),
};

export function formatPrice(amount: number, currency: PriceCurrency) {
  return formatters[currency].format(amount);
}

function parsePrice(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

function useUsdPerEur(enabled: boolean) {
  const rate = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => unwrap(await api.GET('/exchange-rate')),
    enabled,
    staleTime: (query) => (query.state.data?.usd_per_eur == null ? 0 : 60 * 60 * 1000),
    refetchInterval: (query) => (query.state.data?.usd_per_eur == null ? 5 * 60 * 1000 : false),
  });
  return rate.data?.usd_per_eur ?? null;
}

function finishPrices(card: ScryfallCard, foil: boolean, currency: PriceCurrency) {
  const regular = parsePrice(card.prices?.[currency]);
  const foiled = parsePrice(card.prices?.[`${currency}_foil`]);
  return foil ? [foiled, regular] : [regular, foiled];
}

function printPrice(card: ScryfallCard, foil: boolean, currency: PriceCurrency, usdPerEur: number | null) {
  const [first, second] = finishPrices(card, foil, currency);
  if (currency === 'usd' || !usdPerEur) {
    return first ?? second;
  }
  const toEur = (usd: number | null) => (usd === null ? null : usd / usdPerEur);
  const [usdFirst, usdSecond] = finishPrices(card, foil, 'usd');
  return first ?? toEur(usdFirst) ?? second ?? toEur(usdSecond);
}

interface PriceTextProps extends TextProps, Omit<ComponentPropsWithoutRef<'p'>, keyof TextProps | 'children'> {
  onImage?: boolean;
  children: ReactNode;
}

export function PriceText({ onImage = false, children, ...props }: PriceTextProps) {
  return (
    <Text className="tamiyo-hand" size="lg" c={onImage ? 'prune.2' : 'prune'} {...props}>
      {children}
    </Text>
  );
}

interface PrintingPriceProps extends TextProps {
  printing: ScryfallCard;
  foil?: boolean;
}

export function PrintingPrice({ printing, foil = false, ...props }: PrintingPriceProps) {
  const currency = usePriceCurrency();
  const usdPerEur = useUsdPerEur(currency === 'eur');
  if (!currency) {
    return null;
  }
  const amount = printPrice(printing, foil, currency, usdPerEur);
  return (
    <PriceText {...props}>
      {amount === null ? 'Prix inconnu' : formatPrice(amount, currency)}
      {foil && amount !== null ? ' (foil)' : ''}
    </PriceText>
  );
}

interface PrintPriceProps extends TextProps {
  scryfallId: string;
  foil?: boolean;
}

export function PrintPrice({ scryfallId, foil = false, ...props }: PrintPriceProps) {
  const currency = usePriceCurrency();
  const card = useScryfallCard(currency ? scryfallId : null);
  if (!card.data) {
    return null;
  }
  return <PrintingPrice printing={card.data} foil={foil} {...props} />;
}

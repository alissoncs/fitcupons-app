export function formatCents(cents: number, _currency = 'BRL'): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function discountPercent(
  originalCents: number,
  currentCents: number,
): number | null {
  if (
    !Number.isFinite(originalCents) ||
    !Number.isFinite(currentCents) ||
    originalCents <= 0 ||
    currentCents > originalCents
  ) {
    return null;
  }
  return Math.round((1 - currentCents / originalCents) * 100);
}

export function savingsCents(
  originalCents: number,
  currentCents: number,
): number | null {
  if (
    !Number.isFinite(originalCents) ||
    !Number.isFinite(currentCents) ||
    originalCents <= currentCents
  ) {
    return null;
  }
  return originalCents - currentCents;
}

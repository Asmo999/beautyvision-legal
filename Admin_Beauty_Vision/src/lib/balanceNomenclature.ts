interface BalanceNomenclature {
  size: string | null;
  nomenclatureId: string;
}

interface BalanceProduct {
  variants?: { size: string }[];
  sizes?: string[];
  balanceNomenclatures?: BalanceNomenclature[];
}

const normalizeSize = (size: string | null | undefined) => size?.trim() || null;

export function getMissingBalanceNomenclatureSizes(product: BalanceProduct): (string | null)[] {
  const sizes = product.variants?.length
    ? product.variants.map((variant) => variant.size)
    : product.sizes?.length ? product.sizes : [null];
  const entries = product.balanceNomenclatures ?? [];
  const fallback = entries.find((entry) => normalizeSize(entry.size) === null);

  return [...new Set(sizes.map(normalizeSize))].filter((size) => {
    const exact = entries.find((entry) => normalizeSize(entry.size) === size);
    return !(exact ?? fallback)?.nomenclatureId?.trim();
  });
}

export function getBalanceNomenclatureRows(
  sizes: string[],
  entries: BalanceNomenclature[],
): BalanceNomenclature[] {
  const choices = sizes.length ? [...new Set(sizes.map(normalizeSize))] : [null];
  // Existing default mappings also cover variants and must survive editing.
  if (!choices.includes(null) && entries.some((entry) => normalizeSize(entry.size) === null)) {
    choices.unshift(null);
  }
  return choices.map((size) => ({
    size,
    nomenclatureId: entries.find((entry) => normalizeSize(entry.size) === size)?.nomenclatureId ?? '',
  }));
}

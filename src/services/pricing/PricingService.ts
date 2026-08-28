import type { IPricingRule } from "@/models/PricingRule";
import type { PriceResult, PricingTier } from "@/types";

/**
 * PricingService — determines the correct unit price for a given variant
 * and quantity, based on admin-configured tiered pricing rules.
 *
 * Architecture rule: prices are ALWAYS calculated server-side. Never trust
 * prices sent from the client.
 */
export class PricingService {
  /**
   * Find the applicable pricing tier for a given quantity.
   */
  static findTier(tiers: PricingTier[], quantity: number): PricingTier | null {
    // Sort tiers ascending by minQty
    const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);

    for (let i = sorted.length - 1; i >= 0; i--) {
      const tier = sorted[i];
      if (quantity >= tier.minQty) {
        if (tier.maxQty === null || quantity <= tier.maxQty) {
          return tier;
        }
      }
    }

    // Fall back to first tier if quantity is below all minimums
    return sorted[0] ?? null;
  }

  /**
   * Calculate the price for a variant at a given quantity.
   *
   * @param pricingRule - The rule fetched from DB for this variant
   * @param quantity    - Number of packs being ordered
   * @param basePrice   - Fallback if no pricing rule exists
   */
  static calculate(
    pricingRule: IPricingRule | null,
    quantity: number,
    basePrice: number
  ): PriceResult {
    if (!pricingRule || !pricingRule.isActive || pricingRule.tiers.length === 0) {
      // No pricing rule — use flat base price
      const tier: PricingTier = { minQty: 1, maxQty: null, unitPrice: basePrice };
      return {
        unitPrice: basePrice,
        totalPrice: basePrice * quantity,
        tier,
      };
    }

    const tier = this.findTier(pricingRule.tiers as PricingTier[], quantity);

    if (!tier) {
      return {
        unitPrice: basePrice,
        totalPrice: basePrice * quantity,
        tier: { minQty: 1, maxQty: null, unitPrice: basePrice },
      };
    }

    return {
      unitPrice: tier.unitPrice,
      totalPrice: tier.unitPrice * quantity,
      tier,
    };
  }

  /**
   * Format a tier as a human-readable label for display and snapshots.
   * e.g. { minQty: 5, maxQty: 9 } → "5–9 packs"
   */
  static formatTierLabel(tier: PricingTier): string {
    if (tier.maxQty === null) return `${tier.minQty}+ packs`;
    if (tier.minQty === tier.maxQty) return `${tier.minQty} pack`;
    return `${tier.minQty}–${tier.maxQty} packs`;
  }
}

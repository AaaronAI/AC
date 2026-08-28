import { describe, expect, it } from "vitest";
import { computeFees, formatCents, MIN_TRANSACTION_CENTS } from "@/lib/fees";

describe("computeFees", () => {
  it("matches the DECISIONS.md D-008 worked example for the $750 package", () => {
    const f = computeFees(75000);
    expect(f.buyerFeeCents).toBe(3750); // 5% of $750
    expect(f.buyerTotalCents).toBe(78750); // $787.50
    expect(f.sellerPayoutCents).toBe(60000); // $600
    expect(f.platformFeeCents).toBe(18750); // $187.50
    expect(f.processingFeeCents).toBe(2314); // 2.9% × $787.50 + $0.30 ≈ $23.14
    expect(f.payoutFeeCents).toBe(175); // 0.25% × $600 + $0.25 = $1.75
    expect(f.platformNetCents).toBe(18750 - 2314 - 175);
  });

  it("matches D-008 tier 1 ($450) and tier 3 ($1,500)", () => {
    const t1 = computeFees(45000);
    expect(t1.buyerTotalCents).toBe(47250);
    expect(t1.sellerPayoutCents).toBe(36000);
    expect(t1.platformFeeCents).toBe(11250);

    const t3 = computeFees(150000);
    expect(t3.buyerTotalCents).toBe(157500);
    expect(t3.sellerPayoutCents).toBe(120000);
    expect(t3.platformFeeCents).toBe(37500);
    expect(t3.processingFeeCents).toBe(4598);
  });

  it("conserves money: buyer total = seller payout + platform fee", () => {
    for (const price of [25000, 45000, 75000, 150000, 500000, 123457]) {
      const f = computeFees(price);
      expect(f.sellerPayoutCents + f.platformFeeCents).toBe(f.buyerTotalCents);
    }
  });

  it("rejects transactions under the $250 minimum", () => {
    expect(() => computeFees(MIN_TRANSACTION_CENTS - 1)).toThrow(/Minimum/);
    expect(() => computeFees(MIN_TRANSACTION_CENTS)).not.toThrow();
  });

  it("rejects non-positive and fractional amounts", () => {
    expect(() => computeFees(0)).toThrow();
    expect(() => computeFees(-100)).toThrow();
    expect(() => computeFees(750.5)).toThrow();
  });

  it("formats cents as USD", () => {
    expect(formatCents(78750)).toBe("$787.50");
    expect(formatCents(75000)).toBe("$750");
  });
});

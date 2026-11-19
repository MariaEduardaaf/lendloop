import { plural } from "@/lib/format";
import type { IncomingRow } from "@/lib/types";
import { TrustedSeal } from "../trusted-seal";

/**
 * What a lender knows about the borrower before approving: the seal and past returns (counts only).
 * Inherits the text colour; `onMustard` darkens the seal, which is too faint in moss on mustard.
 */
export function BorrowerContext({ loan, onMustard = false }: { loan: IncomingRow; onMustard?: boolean }) {
  const { returned, returnedLate } = loan.borrowerHistory;
  const history =
    returned === 0
      ? "First loan on LendLoop"
      : `Returned ${plural(returned, "loan")}, ${returnedLate === 0 ? "all on time" : `${returnedLate} late`}`;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>{history}</span>
      {loan.borrowerTrustedLender && <TrustedSeal className={onMustard ? "text-mustard-ink" : undefined} />}
    </span>
  );
}

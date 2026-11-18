import { plural } from "@/lib/format";
import type { IncomingRow } from "@/lib/types";
import { TrustedSeal } from "../trusted-seal";

/** What a lender knows about the borrower before approving: the seal and past returns (counts only). */
export function BorrowerContext({ loan }: { loan: IncomingRow }) {
  const { returned, returnedLate } = loan.borrowerHistory;
  const history =
    returned === 0
      ? "First loan on LendLoop"
      : `Returned ${plural(returned, "loan")}, ${returnedLate === 0 ? "all on time" : `${returnedLate} late`}`;
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
      {loan.borrowerTrustedLender && <TrustedSeal />}
      <span>{history}</span>
    </p>
  );
}

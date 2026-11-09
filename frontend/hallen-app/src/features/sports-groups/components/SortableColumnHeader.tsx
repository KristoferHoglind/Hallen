import type { ReactNode } from "react";
import { Button } from "react-bootstrap";

export function SortableColumnHeader({
  label,
  direction,
  onSort,
  children,
}: {
  label: string;
  direction?: "ascending" | "descending";
  onSort: () => void;
  children?: ReactNode;
}) {
  const icon =
    direction === "ascending"
      ? "bi-arrow-up"
      : direction === "descending"
        ? "bi-arrow-down"
        : "bi-arrow-down-up";

  return (
    <th scope="col" aria-sort={direction}>
      <Button
        variant="link"
        className="p-0 text-reset fw-semibold text-decoration-none text-nowrap"
        onClick={onSort}
        aria-label={`Sortera efter ${label.toLocaleLowerCase("sv-SE")}`}
      >
        {label}
        <i className={`bi ${icon} ms-2`} aria-hidden="true" />
      </Button>
      {children}
    </th>
  );
}

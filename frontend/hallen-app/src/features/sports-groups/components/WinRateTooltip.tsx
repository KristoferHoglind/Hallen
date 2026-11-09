import { useId } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

const explanation =
  "Vinstprocent = vinster ÷ (vinster + förluster) × 100. Om inga matcher har avgjorts visas 0 %.";

export function WinRateTooltip() {
  const id = useId();

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={id}>{explanation}</Tooltip>}
    >
      <Button
        type="button"
        variant="link"
        className="p-0 ms-1 text-reset"
        aria-label={explanation}
        onClick={(event) => event.currentTarget.focus()}
      >
        <i className="bi bi-info-circle" aria-hidden="true" />
      </Button>
    </OverlayTrigger>
  );
}

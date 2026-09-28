import { Accordion } from "react-bootstrap";
import type { GameMatch } from "../types/gameMatch";
import { MatchHistoryItem } from "./MatchHistoryItem";

type MatchHistoryAccordionProps = {
  matches: GameMatch[];
  isSaving: boolean;
  canManage: boolean
  onEditMatch: (match: GameMatch) => void;
  onDeleteMatch: (match: GameMatch) => void;
};

export function MatchHistoryAccordion({
  matches,
  isSaving,
  canManage,
  onEditMatch,
  onDeleteMatch,
}: MatchHistoryAccordionProps) {
  return (
    <Accordion alwaysOpen>
      {matches.map((match) => (
        <MatchHistoryItem
          key={match.id}
          match={match}
          isSaving={isSaving}
          canManage={canManage}
          onEdit={onEditMatch}
          onDelete={onDeleteMatch}
        />
      ))}
    </Accordion>
  );
}
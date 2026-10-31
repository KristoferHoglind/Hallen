import { useMemo, useState } from "react";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import type {
  CreateGameMatchRequest,
  GameMatch,
  UpdateGameMatchRequest,
} from "../types/gameMatch";

export type ScoreInput = {
  gameTeamId: string;
  score: number;
};

export function useMatchForm(teams: GameSessionTeam[], matches: GameMatch[]) {
  const nextMatchNumber =
    matches.reduce(
      (highest, match) => Math.max(highest, match.matchNumber),
      0,
    ) + 1;
  const defaultMatchName = `Match ${nextMatchNumber}`;
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }, [teams]);

  const [scoreInputs, setScoreInputs] = useState<ScoreInput[]>(() =>
    createEmptyScoreInputs(sortedTeams),
  );

  const [selectedWinnerId, setWinnerGameTeamId] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const matchTeams =
    sortedTeams.length === 2
      ? sortedTeams
      : sortedTeams.filter((team) => selectedTeamIds.includes(team.id));

  const isDraw =
    matchTeams.length === 2 &&
    (scoreInputs.find((input) => input.gameTeamId === matchTeams[0].id)
      ?.score ?? 0) ===
      (scoreInputs.find((input) => input.gameTeamId === matchTeams[1].id)
        ?.score ?? 0);
  const winnerGameTeamId =
    isDraw && matchTeams.some((team) => team.id === selectedWinnerId)
      ? selectedWinnerId
      : null;

  function toggleTeam(gameTeamId: string) {
    setWinnerGameTeamId(null);
    setSelectedTeamIds((current) =>
      current.includes(gameTeamId)
        ? current.filter((id) => id !== gameTeamId)
        : current.length < 2
          ? [...current, gameTeamId]
          : current,
    );
    setScoreInputs((current) =>
      current.map((input) =>
        input.gameTeamId === gameTeamId ? { ...input, score: 0 } : input,
      ),
    );
  }

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchNameDraft, setMatchNameInput] = useState<string | null>(null);
  const matchNameInput = matchNameDraft ?? defaultMatchName;

  function createEmptyScoreInputsForCurrentTeams() {
    return createEmptyScoreInputs(sortedTeams);
  }

  function updateScoreInput(gameTeamId: string, score: number) {
    setWinnerGameTeamId(null);
    setScoreInputs((current) => {
      const existingInput = current.find(
        (input) => input.gameTeamId === gameTeamId,
      );

      const safeScore = Math.max(0, score);

      if (!existingInput) {
        return [
          ...current,
          {
            gameTeamId,
            score: safeScore,
          },
        ];
      }

      return current.map((input) =>
        input.gameTeamId === gameTeamId
          ? { ...input, score: safeScore }
          : input,
      );
    });
  }

  function adjustScoreInput(gameTeamId: string, delta: number) {
    setWinnerGameTeamId(null);
    setScoreInputs((current) => {
      const existingInput = current.find(
        (input) => input.gameTeamId === gameTeamId,
      );

      if (!existingInput) {
        return [
          ...current,
          {
            gameTeamId,
            score: Math.max(0, delta),
          },
        ];
      }

      return current.map((input) =>
        input.gameTeamId === gameTeamId
          ? {
              ...input,
              score: Math.max(0, input.score + delta),
            }
          : input,
      );
    });
  }

  function resetForm() {
    setWinnerGameTeamId(null);
    setSelectedTeamIds([]);
    setEditingMatchId(null);
    setMatchNameInput(null);
    setScoreInputs(createEmptyScoreInputsForCurrentTeams());
  }

  function startEdit(match: GameMatch) {
    setWinnerGameTeamId(match.winnerGameTeamId ?? null);
    setSelectedTeamIds(match.teamResults.map((result) => result.gameTeamId));
    setEditingMatchId(match.id);
    setMatchNameInput(match.name || `Match ${match.matchNumber}`);

    setScoreInputs(
      sortedTeams.map((team) => {
        const existingResult = match.teamResults.find(
          (result) => result.gameTeamId === team.id,
        );

        return {
          gameTeamId: team.id,
          score: existingResult?.score ?? 0,
        };
      }),
    );
  }

  function buildRequest(): CreateGameMatchRequest | UpdateGameMatchRequest {
    return {
      name: matchNameInput.trim() || defaultMatchName,
      winnerGameTeamId,
      teamResults: matchTeams.map((team) => {
        const input = scoreInputs.find(
          (scoreInput) => scoreInput.gameTeamId === team.id,
        );

        return {
          gameTeamId: team.id,
          score: input?.score ?? 0,
        };
      }),
    };
  }

  return {
    sortedTeams,
    isDraw,
    winnerGameTeamId,
    setWinnerGameTeamId,
    matchTeams,
    toggleTeam,
    scoreInputs,
    editingMatchId,
    matchNameInput,
    setMatchNameInput,
    updateScoreInput,
    adjustScoreInput,
    resetForm,
    startEdit,
    buildRequest,
  };
}

function createEmptyScoreInputs(teams: GameSessionTeam[]): ScoreInput[] {
  return teams.map((team) => ({
    gameTeamId: team.id,
    score: 0,
  }));
}

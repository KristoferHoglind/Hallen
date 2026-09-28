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

export function useMatchForm(teams: GameSessionTeam[]) {
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }, [teams]);

  const [scoreInputs, setScoreInputs] = useState<ScoreInput[]>(() =>
    createEmptyScoreInputs(sortedTeams),
  );

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchNameInput, setMatchNameInput] = useState("Match");

  function createEmptyScoreInputsForCurrentTeams() {
    return createEmptyScoreInputs(sortedTeams);
  }

  function updateScoreInput(gameTeamId: string, score: number) {
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
    setEditingMatchId(null);
    setMatchNameInput("Match");
    setScoreInputs(createEmptyScoreInputsForCurrentTeams());
  }

  function startEdit(match: GameMatch) {
    setEditingMatchId(match.id);
    setMatchNameInput(match.name || "Match");

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
      name: matchNameInput.trim() || "Match",
      teamResults: sortedTeams.map((team) => {
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
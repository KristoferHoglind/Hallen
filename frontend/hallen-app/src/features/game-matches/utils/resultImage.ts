import type { GameMatch } from "../types/gameMatch";
import type { TeamStanding } from "./gameMatchStandings";
import type { SessionAward } from "./sessionAwards";

export async function createResultImage(
  name: string,
  startsAt: string | undefined,
  standings: TeamStanding[],
  matches: GameMatch[],
  anecdote: string | undefined,
  awards: SessionAward[],
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Din webbläsare kan inte skapa resultatbilden.");
  const lines: {
    text: string;
    x: number;
    y: number;
    font: string;
    color: string;
  }[] = [];
  let y = 72;
  function text(
    value: string,
    size = 28,
    bold = false,
    color = "#203c30",
    x = 64,
    width = 1072,
  ) {
    const font = `${bold ? "700" : "400"} ${size}px system-ui, sans-serif`;
    ctx!.font = font;
    let line = "";
    const emit = () => {
      lines.push({ text: line.trimEnd(), x, y, font, color });
      y += size * 1.45;
      line = "";
    };
    for (const paragraph of value.split("\n")) {
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx!.measureText(candidate).width <= width) {
          line = candidate;
          continue;
        }
        if (line) emit();
        // Break only genuinely unbroken strings; ordinary words stay intact.
        for (const character of Array.from(word)) {
          if (line && ctx!.measureText(line + character).width > width) emit();
          line += character;
        }
      }
      emit();
    }
  }
  const logo = new Image();
  logo.src = "/favicon.svg";
  const hasLogo = await logo
    .decode()
    .then(() => true)
    .catch(() => false);
  text("HALLEN", 26, true, "#17614c", hasLogo ? 116 : 64, 1020);
  y += 12;
  text(name, 46, true);
  if (startsAt)
    text(
      new Intl.DateTimeFormat("sv-SE", {
        dateStyle: "long",
        timeZone: "Europe/Stockholm",
      }).format(new Date(startsAt)),
      24,
    );
  y += 28;
  text("Sammanställning", 32, true);
  const rules: number[] = [];
  function tableRow(values: string[], header = false) {
    const columns = [64, 530, 635, 740, 845, 965];
    const widths = [440, 90, 90, 90, 90, 170];
    const start = y;
    let bottom = start;
    values.forEach((value, index) => {
      y = start;
      text(
        value,
        header ? 22 : 26,
        header || index === 0,
        header ? "#66736c" : "#203c30",
        columns[index],
        widths[index],
      );
      bottom = Math.max(bottom, y);
    });
    y = bottom + 16;
    rules.push(y - 32);
  }
  tableRow(["Lag", "M", "V", "O", "F", "+/−"], true);
  for (const team of standings) {
    tableRow([
      team.gameTeamName,
      String(team.gamesPlayed),
      String(team.wins),
      String(team.draws),
      String(team.losses),
      `${team.goalDifference > 0 ? "+" : ""}${team.goalDifference}`,
    ]);
  }
  text(
    "M = Matcher   V = Vinster   O = Oavgjorda   F = Förluster   +/− = Poängskillnad",
    20,
    false,
    "#66736c",
  );
  y += 28;
  text("Matchresultat", 32, true);
  for (const match of [...matches].sort(
    (a, b) => a.matchNumber - b.matchNumber,
  )) {
    y += 10;
    text(match.name || `Match ${match.matchNumber}`, 26, true);
    const rosterStart = y;
    let rosterBottom = rosterStart;
    match.teamResults.forEach((result, index) => {
      y = rosterStart;
      const columnWidth = match.teamResults.length === 2 ? 512 : 1072;
      const x = match.teamResults.length === 2 ? 64 + index * 560 : 64;
      if (match.teamResults.length !== 2) y = rosterBottom;
      text(
        `${result.gameTeamName} · ${result.score}`,
        26,
        true,
        "#203c30",
        x,
        columnWidth,
      );
      const playerNames = [...result.players]
        .sort(
          (a, b) =>
            a.playerName.localeCompare(b.playerName, "sv") ||
            a.playerId.localeCompare(b.playerId),
        )
        .map((player) => player.playerName);
      text(
        playerNames.length
          ? playerNames.join(", ")
          : "Ingen spelaruppställning sparad.",
        22,
        false,
        "#66736c",
        x,
        columnWidth,
      );
      rosterBottom = Math.max(rosterBottom, y);
    });
    y = rosterBottom + 12;
    if (match.winnerGameTeamId)
      text(
        `Utsedd vinnare: ${match.teamResults.find((r) => r.gameTeamId === match.winnerGameTeamId)?.gameTeamName ?? ""}`,
        22,
      );
  }
  if (awards.length) {
    y += 28;
    text("Kvällens utmärkelser", 32, true);
    for (const award of awards) {
      y += 12;
      text(award.title, 26, true);
      text(award.description, 24);
    }
  }
  if (anecdote) {
    y += 28;
    text("Snacket vid sidlinjen", 32, true);
    text(anecdote, 26);
  }
  y += 40;
  text("Skapat med Hallen", 22, false, "#66736c");
  if (y > 30000)
    throw new Error(
      "Sessionen innehåller för mycket text för en enda resultatbild.",
    );
  canvas.height = Math.ceil(y + 48);
  ctx.fillStyle = "#fcfcf9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#17614c";
  ctx.fillRect(0, 0, canvas.width, 12);
  if (hasLogo) ctx.drawImage(logo, 64, 41, 38, 38);
  ctx.strokeStyle = "#dce3dd";
  ctx.lineWidth = 1;
  for (const rule of rules) {
    ctx.beginPath();
    ctx.moveTo(64, rule);
    ctx.lineTo(1136, rule);
    ctx.stroke();
  }
  for (const line of lines) {
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, line.x, line.y);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Kunde inte skapa bilden.")),
      "image/png",
    ),
  );
}

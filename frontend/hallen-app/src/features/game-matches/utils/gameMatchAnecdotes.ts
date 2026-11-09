import type { GameMatch } from "../types/gameMatch";
import type { TeamStanding } from "./gameMatchStandings";

const names = (teams: TeamStanding[]) =>
  new Intl.ListFormat("sv", { style: "long", type: "conjunction" }).format(
    teams.map((team) => team.gameTeamName),
  );
const winsLabel = (wins: number) =>
  `${wins} ${wins === 1 ? "vinst" : "vinster"}`;

// Seed from saved results, independent of list order and UI state. A new result
// gives a new selection without reshuffling while editing or changing tabs.
function resultRandom(matches: GameMatch[], standings: TeamStanding[]) {
  const signature = JSON.stringify([
    matches
      .map((match) => [
        match.id,
        match.winnerGameTeamId ?? null,
        match.teamResults
          .map((result) => [result.gameTeamId, result.score])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      ])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    standings
      .map((team) => [team.gameTeamId, team.gameTeamName])
      .sort((a, b) => a[0].localeCompare(b[0])),
  ]);
  let seed = 2166136261;
  for (const character of signature)
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function buildPlayerAnecdotes(matches: GameMatch[], random: () => number) {
  const stats = new Map<
    string,
    {
      name: string;
      games: number;
      wins: number;
      cleanSheets: number;
      closeWins: number;
    }
  >();

  for (const { teamResults, winnerGameTeamId } of matches) {
    if (teamResults.length !== 2) continue;
    const [first, second] = teamResults;
    for (const [team, opponent] of [
      [first, second],
      [second, first],
    ]) {
      const won = winnerGameTeamId
        ? winnerGameTeamId === team.gameTeamId
        : team.score > opponent.score;
      for (const { playerId, playerName } of team.players ?? []) {
        const player = stats.get(playerId) ?? {
          name: playerName,
          games: 0,
          wins: 0,
          cleanSheets: 0,
          closeWins: 0,
        };
        player.games++;
        if (won) player.wins++;
        if (opponent.score === 0) player.cleanSheets++;
        if (won && team.score - opponent.score === 1) player.closeWins++;
        stats.set(playerId, player);
      }
    }
  }

  const players = [...stats.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, player]) => player);
  const anecdotes: string[] = [];
  const pick = <T>(options: T[]) =>
    options[Math.floor(random() * options.length)];
  const featured = new Set<(typeof players)[number]>();

  function spotlight(
    stat: "games" | "wins" | "cleanSheets" | "closeWins",
    minimum: number,
    lines: (name: string, count: number) => string[],
  ) {
    const best = Math.max(0, ...players.map((player) => player[stat]));
    if (best < minimum) return;
    const tied = players.filter((player) => player[stat] === best);
    const fresh = tied.filter((player) => !featured.has(player));
    const player = pick(fresh.length ? fresh : tied);
    featured.add(player);
    anecdotes.push(pick(lines(player.name, best)));
  }

  spotlight("wins", 1, (name, wins) => [
    `Kvällens segermagnet: ${name}! ${winsLabel(wins)} i bagaget. Ryktet säger att nästa laglottning redan är överklagad.`,
    `${name} spelade hem ${winsLabel(wins)}. Någon har tydligen tagit med sig en egen turmaskot till hallen!`,
    `${name} fick fira ${winsLabel(wins)}. Vid det här laget borde segerdansen räknas som uppvärmning.`,
  ]);
  spotlight("cleanSheets", 1, (name, count) => [
    `Kvällens låssmed: ${name}! ${count === 1 ? "En hållen nolla" : `${count} hållna nollor`} med sitt lag. Vem gömde nyckeln till målet?`,
    `${name} var med och höll nollan ${count === 1 ? "i en match" : `i ${count} matcher`}. Har någon tjuvövat på att stänga butiken?`,
  ]);
  spotlight("closeWins", 1, (name, count) => [
    `${name} fick jubla efter ${count === 1 ? "en uddamålsseger" : `${count} uddamålssegrar`}. Någon får gärna kolla hur sidlinjens pulsklocka mår.`,
    `${name} var med och vann ${count === 1 ? "en match" : `${count} matcher`} med ett enda måls marginal. Var all den där dramatiken verkligen nödvändig?`,
  ]);
  spotlight("games", 1, (name, count) => [
    `${name} klockade in på ${count === 1 ? "en match" : `${count} matcher`}. Stämpelklockan i hallen hälsar och tackar.`,
    `${name} tog plats på planen i ${count === 1 ? "en match" : `${count} matcher`}. Vattenflaskan fick åtminstone följa med som reserv.`,
  ]);

  if (anecdotes.length === 0) {
    anecdotes.push(
      pick([
        "Matchprotokollet har koll på siffrorna. Resten får vi höra i omklädningsrummet!",
        "Sekretariatet har sparat resultatet. Vem som stod för kvällens snyggaste fint får sidlinjen debattera vidare.",
      ]),
    );
  }

  return anecdotes;
}

export function buildGameMatchAnecdotes(
  matches: GameMatch[],
  standings: TeamStanding[],
): string[] {
  const played = standings.filter((team) => team.gamesPlayed > 0);
  if (matches.length === 0 || played.length === 0) return [];
  const random = resultRandom(matches, standings);
  if (standings.length === 2) return buildPlayerAnecdotes(matches, random);
  const pick = (options: string[]) =>
    options[Math.floor(random() * options.length)];
  const candidates: string[] = [];
  const maxWins = Math.max(...played.map((team) => team.wins));
  const leaders = played.filter((team) => team.wins === maxWins);
  let headline: string;
  if (maxWins > 0 && leaders.length === 1) {
    const leader = leaders[0].gameTeamName;
    const chasing = played.filter(
      (team) => team.gameTeamId !== leaders[0].gameTeamId,
    );
    const gap = maxWins - Math.max(0, ...chasing.map((team) => team.wins));
    headline = pick(
      gap >= 3
        ? [
            `${leader} har dragit ifrån med ${winsLabel(maxWins)} – ${gap} fler än närmaste utmanare. Ajajaj! Nu får ${names(chasing)} lägga i en extra växel.`,
            `${winsLabel(maxWins)} för ${leader}! Med ${gap} vinster ner till närmaste utmanare börjar det lukta segerdans. Lite tidigt? Kanske.`,
            `${leader} har ${winsLabel(maxWins)} och ett försprång på ${gap} vinster. Resten av gänget: dags att avbryta fikapausen!`,
            `${leader} verkar ha hittat turboknappen: ${winsLabel(maxWins)} och ${gap} vinster till godo. Vem har gömt fjärrkontrollen?`,
          ]
        : [
            `${leader} har flest vinster: ${winsLabel(maxWins)}. Men med bara ${winsLabel(gap)} till närmaste utmanare är det för tidigt att börja fira!`,
            `${leader} toppar vinstligan med ${winsLabel(maxWins)}. Närmaste utmanare är bara ${winsLabel(gap)} bakom. Håll i vattenflaskorna!`,
            `${winsLabel(maxWins)} ger ${leader} flest segrar just nu. Men ${winsLabel(gap)} är ingen vallgrav – här kan det svänga snabbt!`,
            `${leader} har nosen framför med ${winsLabel(maxWins)}. Bara ${winsLabel(gap)} skiljer till närmaste utmanare. Ingen kan slappna av ännu!`,
          ],
    );
  } else if (maxWins > 0) {
    headline = pick([
      `${names(leaders)} har lika många vinster: ${maxWins} var. Ingen tänker släppa taget – det här kan bli svettigt!`,
      `${names(leaders)} delar förstaplatsen i vinstligan med ${maxWins} segrar var. Någon måste snart släppa fram den andra i dörren.`,
      `${maxWins} vinster var för ${names(leaders)}. Det är så jämnt att sidlinjen snart behöver målfoto!`,
      `${names(leaders)} vägrar ge varandra arbetsro: ${maxWins} vinster var. Vem blinkar först?`,
    ]);
  } else {
    headline = pick([
      "Ingen har tagit en seger ännu. Lagen verkar ha skrivit under ett fredsavtal – vem bryter dödläget?",
      "Vinstkolumnen står fortfarande på noll för alla. Väldigt diplomatiskt, men någon får gärna ta initiativet!",
      "Ingen segrare ännu. Här delar man på äran med en noggrannhet som skulle imponera på en revisor.",
    ]);
  }

  const mostGoals = Math.max(...played.map((team) => team.goalsFor));
  const scorers = played.filter((team) => team.goalsFor === mostGoals);
  const goalCount = `${mostGoals}${scorers.length > 1 ? " var" : ""}`;
  candidates.push(
    pick(
      mostGoals > 0
        ? [
            `${names(scorers)} har gjort flest mål: ${goalCount}. Målvakterna lär knappast be om extranummer!`,
            `${names(scorers)} har skickat in ${goalCount} mål, flest av alla. Någon borde kolla om nätet fortfarande sitter fast.`,
            `Målmaskinen går varm hos ${names(scorers)}: ${goalCount} mål. Motståndarna önskar nog att det fanns en pausknapp.`,
            `${names(scorers)} leder målproduktionen med ${goalCount} mål. Det är leveranssäkerhet som vilket paketbud som helst skulle avundas!`,
          ]
        : [
            "Noll mål hittills. Försvaret verkar ha parkerat både bussen och släpvagnen framför målet!",
            "Målnäten är fortfarande orörda. Skönt för materialförvaltaren, lite frustrerande för anfallarna.",
            "Inga mål ännu. Antingen är försvaren fantastiska, eller så väntar alla på ett skriftligt tillstånd att skjuta.",
          ],
    ),
  );

  const unbeaten = played.filter((team) => team.losses === 0 && team.wins > 0);
  if (unbeaten.length)
    candidates.push(
      pick([
        `${names(unbeaten)} är fortfarande obesegrade. Någon som har sparat ett ess i rockärmen för att ändra på det?`,
        `${names(unbeaten)} har ännu inte behövt smaka på en förlust. Det är nästan provocerande bra stämning där borta!`,
        `Förlustkolumnen gapar tom hos ${names(unbeaten)}. Motståndarna söker just nu efter en bruksanvisning.`,
        `${names(unbeaten)} håller förlustsviten på exakt noll. En mycket bekväm siffra att försvara!`,
      ]),
    );

  const winless = played.filter(
    (team) => team.wins === 0 && team.gamesPlayed >= 2,
  );
  if (winless.length)
    candidates.push(
      pick([
        `${names(winless)} väntar fortfarande på första vinsten. Perfekt läge för en hjälteentré!`,
        `Ingen seger ännu för ${names(winless)}, men en bra vändning behöver ju en dramatisk inledning.`,
        `${names(winless)} sparar tydligen segerdansen till senare. Vi hoppas att koreografin blir värd väntan!`,
      ]),
    );

  const pairs = matches.filter((match) => match.teamResults.length === 2);
  const draws = pairs.filter(
    (match) =>
      !match.winnerGameTeamId &&
      match.teamResults[0].score === match.teamResults[1].score,
  ).length;
  if (draws)
    candidates.push(
      pick([
        `${draws} av ${matches.length} matcher har slutat oavgjort. Rättvist och vänskapligt? Eller vägrar någon helt enkelt att förlora?`,
        `${draws} oavgjorda matcher hittills. Här förhandlar lagen tydligen fram resultaten med millimeterrättvisa.`,
        `Delad ära i ${draws} av ${matches.length} matcher. Den som uppfann ordet lagom hade känt sig hemma här.`,
      ]),
    );

  const decidedTies = pairs.filter(
    (match) =>
      match.winnerGameTeamId &&
      match.teamResults[0].score === match.teamResults[1].score,
  ).length;
  if (decidedTies)
    candidates.push(
      pick([
        `Lika på tavlan, avgjort ändå! ${decidedTies} ${decidedTies === 1 ? "match har" : "matcher har"} fått en utsedd vinnare trots lika poäng. Här nöjer man sig inte med delad ära.`,
        `${decidedTies} matcher med lika poäng har ändå fått en vinnare. Resultattavlan fick tydligen inte sista ordet!`,
        `I ${decidedTies} matcher har en vinnare utsetts trots lika poäng. Spänningen tog alltså inte slut bara för att siffrorna blev överens.`,
      ]),
    );

  const closeGames = pairs.filter(
    (match) =>
      Math.abs(match.teamResults[0].score - match.teamResults[1].score) === 1,
  ).length;
  if (closeGames)
    candidates.push(
      pick([
        `${closeGames} matcher har avgjorts med ett enda måls marginal. Pulsklockorna tackar för träningspasset!`,
        `Bara ett mål skilde lagen åt i ${closeGames} matcher. Små marginaler, stora känslor.`,
        `${closeGames} uddamålsmatcher. Här kan ett enda skott förvandla suckar till segerjubel!`,
      ]),
    );

  const totalGoals = matches.reduce(
    (sum, match) =>
      sum +
      match.teamResults.reduce((goals, result) => goals + result.score, 0),
    0,
  );
  if (totalGoals > 0)
    candidates.push(
      pick([
        `${totalGoals} mål på ${matches.length} matcher. Sekretariatet har i alla fall inte behövt lösa korsord för att hålla sig sysselsatt!`,
        `Totalt ${totalGoals} mål hittills. Det är ${totalGoals} anledningar att jubla – och ungefär lika många att sucka.`,
        `${totalGoals} gånger har bollen hittat nätet under sessionen. Någon får snart börja räkna på tårna också!`,
      ]),
    );

  const highestTotal = Math.max(
    0,
    ...pairs.map((match) =>
      match.teamResults.reduce((sum, result) => sum + result.score, 0),
    ),
  );
  if (highestTotal >= 5)
    candidates.push(
      pick([
        `Den målrikaste matchen bjöd på ${highestTotal} mål. Försvarsspel? Det tar vi på nästa träning!`,
        `${highestTotal} mål i en och samma match är sessionens rekord. Publiken fick valuta för applåderna!`,
        `Målrekordet för en match är ${highestTotal}. Där hann man knappt sätta ner kaffekoppen mellan jubelropen.`,
      ]),
    );

  const bestDifference = Math.max(...played.map((team) => team.goalDifference));
  const differenceLeaders = played.filter(
    (team) => team.goalDifference === bestDifference,
  );
  if (bestDifference > 0)
    candidates.push(
      pick([
        `${names(differenceLeaders)} har bäst målskillnad: +${bestDifference}. Pluskontot mår fint, tackar som frågar!`,
        `+${bestDifference} i målskillnad för ${names(differenceLeaders)}, bäst i gänget. Det är siffror man gärna visar upp på kylskåpet.`,
        `${names(differenceLeaders)} har byggt upp målskillnaden till +${bestDifference}. Ett litet sparkonto av mål, helt enkelt.`,
      ]),
    );

  // Keep one overview plus a varied selection of distinct statistical topics.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return [headline, ...candidates.slice(0, 4)];
}

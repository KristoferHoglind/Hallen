namespace Hallen.Common.DTOs.SportsGroups;

public record GroupStatisticsDto(int Sessions, int PlayedSessions, int Matches, long TotalScore,
    int Draws, int Tiebreaks, int Players, double AverageScore,
    GroupMatchRecordDto? HighestScoringMatch, GroupMatchRecordDto? BiggestWin,
    List<GroupPlayerStatisticsDto> PlayerStandings);
public record GroupMatchRecordDto(string MatchName, string SessionName, DateTimeOffset StartsAt,
    string Result, long TotalScore, int Margin);
public record GroupPlayerStatisticsDto(Guid PlayerId, string PlayerName, int Matches, int Wins, int Draws, int Losses);

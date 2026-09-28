using Hallen.Database.Entities;
using Hallen.Database.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Database.Data;

public class HallenDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public HallenDbContext(DbContextOptions<HallenDbContext> options)
        : base(options)
    {
    }

    public DbSet<SportsGroup> SportsGroups => Set<SportsGroup>();

    public DbSet<Player> Players => Set<Player>();

    public DbSet<GameSession> GameSessions => Set<GameSession>();

    public DbSet<GameTeam> GameTeams => Set<GameTeam>();

    public DbSet<GameTeamPlayer> GameTeamPlayers => Set<GameTeamPlayer>();

    public DbSet<GameMatch> GameMatches => Set<GameMatch>();

    public DbSet<GameMatchTeamResult> GameMatchTeamResults => Set<GameMatchTeamResult>();

    public DbSet<GameSessionPlayer> GameSessionPlayers => Set<GameSessionPlayer>();

    public DbSet<GameMatchTeamPlayer> GameMatchTeamPlayers => Set<GameMatchTeamPlayer>();

    public DbSet<SportsGroupMember> SportsGroupMembers => Set<SportsGroupMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.Property(user => user.Status)
                .HasConversion<string>()
                .HasMaxLength(50);
        });

        modelBuilder.Entity<SportsGroupMember>(entity =>
        {
            entity.HasKey(member => member.Id);

            entity.HasIndex(member => new
            {
                member.SportsGroupId,
                member.AppUserId
            }).IsUnique();

            entity.Property(member => member.Role)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(member => member.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasOne(member => member.SportsGroup)
                .WithMany(group => group.Members)
                .HasForeignKey(member => member.SportsGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(member => member.AppUser)
                .WithMany(user => user.SportsGroupMemberships)
                .HasForeignKey(member => member.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(member => member.ApprovedByUser)
                .WithMany(user => user.ApprovedSportsGroupMemberships)
                .HasForeignKey(member => member.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SportsGroup>(entity =>
        {
            entity.ToTable("sports_groups");

            entity.HasKey(sportsGroup => sportsGroup.Id);

            entity.Property(sportsGroup => sportsGroup.Id)
                .HasColumnName("id");

            entity.Property(sportsGroup => sportsGroup.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(sportsGroup => sportsGroup.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();
        });

        modelBuilder.Entity<Player>(entity =>
        {
            entity.ToTable("players");

            entity.HasKey(player => player.Id);

            entity.Property(player => player.Id)
                .HasColumnName("id");

            entity.Property(player => player.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(player => player.IsActive)
                .HasColumnName("is_active")
                .IsRequired();

            entity.Property(player => player.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(player => player.SportsGroupId)
                .HasColumnName("sports_group_id")
                .IsRequired();

            entity.HasOne(player => player.SportsGroup)
                .WithMany(sportsGroup => sportsGroup.Players)
                .HasForeignKey(player => player.SportsGroupId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GameSession>(entity =>
        {
            entity.ToTable("game_sessions");

            entity.HasKey(gameSession => gameSession.Id);

            entity.Property(gameSession => gameSession.Id)
                .HasColumnName("id");

            entity.Property(gameSession => gameSession.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(gameSession => gameSession.StartsAt)
                .HasColumnName("starts_at")
                .IsRequired();

            entity.Property(x => x.NumberOfTeams)
                .IsRequired();

            entity.Property(gameSession => gameSession.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(gameSession => gameSession.SportsGroupId)
                .HasColumnName("sports_group_id")
                .IsRequired();

            entity.HasOne(gameSession => gameSession.SportsGroup)
                .WithMany(sportsGroup => sportsGroup.GameSessions)
                .HasForeignKey(gameSession => gameSession.SportsGroupId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GameTeam>(entity =>
        {
            entity.ToTable("game_teams");

            entity.HasKey(gameTeam => gameTeam.Id);

            entity.Property(gameTeam => gameTeam.Id)
                .HasColumnName("id");

            entity.Property(gameTeam => gameTeam.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(gameTeam => gameTeam.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(gameTeam => gameTeam.GameSessionId)
                .HasColumnName("game_session_id")
                .IsRequired();

            entity.HasOne(gameTeam => gameTeam.GameSession)
                .WithMany(gameSession => gameSession.GameTeams)
                .HasForeignKey(gameTeam => gameTeam.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GameTeamPlayer>(entity =>
        {
            entity.ToTable("game_team_players");

            entity.HasKey(gameTeamPlayer => gameTeamPlayer.Id);

            entity.Property(gameTeamPlayer => gameTeamPlayer.Id)
                .HasColumnName("id");

            entity.Property(gameTeamPlayer => gameTeamPlayer.PlayerId)
                .HasColumnName("player_id")
                .IsRequired();

            entity.Property(gameTeamPlayer => gameTeamPlayer.GameTeamId)
                .HasColumnName("game_team_id")
                .IsRequired();

            entity.Property(gameTeamPlayer => gameTeamPlayer.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.HasOne(gameTeamPlayer => gameTeamPlayer.Player)
                .WithMany(player => player.GameTeamPlayers)
                .HasForeignKey(gameTeamPlayer => gameTeamPlayer.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(gameTeamPlayer => gameTeamPlayer.GameTeam)
                .WithMany(gameTeam => gameTeam.GameTeamPlayers)
                .HasForeignKey(gameTeamPlayer => gameTeamPlayer.GameTeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(gameTeamPlayer => new
            {
                gameTeamPlayer.GameTeamId,
                gameTeamPlayer.PlayerId
            })
                .IsUnique();
        });

        modelBuilder.Entity<GameMatch>(entity =>
        {
            entity.ToTable("game_matches");

            entity.HasKey(gameMatch => gameMatch.Id);

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(gameMatch => gameMatch.Id)
                .HasColumnName("id");

            entity.Property(gameMatch => gameMatch.MatchNumber)
                .HasColumnName("match_number")
                .IsRequired();

            entity.Property(gameMatch => gameMatch.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(gameMatch => gameMatch.FinishedAt)
                .HasColumnName("finished_at");

            entity.Property(gameMatch => gameMatch.GameSessionId)
                .HasColumnName("game_session_id")
                .IsRequired();

            entity.HasOne(gameMatch => gameMatch.GameSession)
                .WithMany(gameSession => gameSession.GameMatches)
                .HasForeignKey(gameMatch => gameMatch.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(gameMatch => new
            {
                gameMatch.GameSessionId,
                gameMatch.MatchNumber
            })
                .IsUnique();
        });

        modelBuilder.Entity<GameMatchTeamResult>(entity =>
        {
            entity.ToTable("game_match_team_results");

            entity.HasKey(gameMatchTeamResult => gameMatchTeamResult.Id);

            entity.Property(gameMatchTeamResult => gameMatchTeamResult.Id)
                .HasColumnName("id");

            entity.Property(gameMatchTeamResult => gameMatchTeamResult.Score)
                .HasColumnName("score")
                .IsRequired();

            entity.Property(gameMatchTeamResult => gameMatchTeamResult.GameMatchId)
                .HasColumnName("game_match_id")
                .IsRequired();

            entity.Property(gameMatchTeamResult => gameMatchTeamResult.GameTeamId)
                .HasColumnName("game_team_id")
                .IsRequired();

            entity.HasOne(gameMatchTeamResult => gameMatchTeamResult.GameMatch)
                .WithMany(gameMatch => gameMatch.TeamResults)
                .HasForeignKey(gameMatchTeamResult => gameMatchTeamResult.GameMatchId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(gameMatchTeamResult => gameMatchTeamResult.GameTeam)
                .WithMany(gameTeam => gameTeam.GameMatchTeamResults)
                .HasForeignKey(gameMatchTeamResult => gameMatchTeamResult.GameTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(gameMatchTeamResult => new
            {
                gameMatchTeamResult.GameMatchId,
                gameMatchTeamResult.GameTeamId
            })
                .IsUnique();
        });

        modelBuilder.Entity<GameSessionPlayer>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasOne(x => x.GameSession)
                .WithMany(x => x.GameSessionPlayers)
                .HasForeignKey(x => x.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Player)
                .WithMany(x => x.GameSessionPlayers)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.GameSessionId, x.PlayerId })
                .IsUnique();
        });

        modelBuilder.Entity<GameMatchTeamPlayer>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.PlayerName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasOne(x => x.GameMatch)
                .WithMany(x => x.TeamPlayers)
                .HasForeignKey(x => x.GameMatchId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.GameTeam)
                .WithMany(x => x.GameMatchTeamPlayers)
                .HasForeignKey(x => x.GameTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Player)
                .WithMany(x => x.GameMatchTeamPlayers)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.GameMatchId, x.GameTeamId, x.PlayerId })
                .IsUnique();
        });
    }
}
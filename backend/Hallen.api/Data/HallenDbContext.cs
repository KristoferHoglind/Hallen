using Hallen.Api.Features.Players;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Data;

public class HallenDbContext : DbContext
{
    public HallenDbContext(DbContextOptions<HallenDbContext> options)
        : base(options) { }

    public DbSet<Player> Players => Set<Player>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(entity =>
        {
            entity.ToTable("players");

            entity.HasKey(player => player.Id);

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
        });
    }
}
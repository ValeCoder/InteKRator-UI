using Microsoft.EntityFrameworkCore;
using InteKRator_UI.Models;

namespace InteKRator_UI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Dataset> Datasets { get; set; }
    public DbSet<DatasetVersion> DatasetVersions { get; set; }
    public DbSet<TrainingResult> TrainingResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Dataset>()
            .HasMany(d => d.Versions)
            .WithOne(v => v.Dataset)
            .HasForeignKey(v => v.DatasetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

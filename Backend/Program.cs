using InteKRator_UI.Data;
using InteKRator_UI.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=datasets.db"));

builder.Services.AddScoped<IDatasetService, DatasetService>();
builder.Services.AddScoped<IVersionService, VersionService>();
builder.Services.AddScoped<ITrainingService, TrainingService>();
builder.Services.AddScoped<IInferenceService, InferenceService>();


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Apply all pending migrations (creates DB if it doesn't exist).
// For databases previously created via EnsureCreated (no migration history),
// we bootstrap the migration table so that only the new AddOutcomeColumnIndex
// migration actually runs, while InitialCreate is treated as already applied.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    bool hasMigrationHistory = false;
    try
    {
        dbContext.Database.ExecuteSqlRaw("SELECT 1 FROM __EFMigrationsHistory LIMIT 1");
        hasMigrationHistory = true;
    }
    catch { /* Table doesn't exist yet */ }

    if (!hasMigrationHistory && dbContext.Database.CanConnect())
    {
        // Existing EnsureCreated database: register InitialCreate as already applied
        // so that Migrate() only runs AddOutcomeColumnIndex.
        dbContext.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (
                MigrationId TEXT NOT NULL CONSTRAINT PK___EFMigrationsHistory PRIMARY KEY,
                ProductVersion TEXT NOT NULL
            )
            """);
        dbContext.Database.ExecuteSqlRaw("""
            INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion)
            VALUES ('20260323134849_InitialCreate', '9.0.0')
            """);
    }

    dbContext.Database.Migrate();
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
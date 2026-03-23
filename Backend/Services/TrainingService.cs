using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IO;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace InteKRator_UI.Services
{
    public class TrainingService : ITrainingService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<TrainingService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public TrainingService(IConfiguration configuration, ILogger<TrainingService> logger, IServiceScopeFactory scopeFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task StartTrainingAsync(int datasetVersionId)
        {
            var jarPath = _configuration["TrainingSettings:JarPath"];
            if (string.IsNullOrEmpty(jarPath))
            {
                _logger.LogError("Training JAR path is not configured.");
                throw new InvalidOperationException("Training JAR path is not configured.");
            }

            if (!System.IO.File.Exists(jarPath))
            {
                 _logger.LogError($"Training JAR file not found at: {jarPath}");
                 throw new FileNotFoundException($"Training JAR file not found at: {jarPath}");
            }

            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                var datasetVersion = await dbContext.DatasetVersions.FirstOrDefaultAsync(dv => dv.Id == datasetVersionId);
                if (datasetVersion == null)
                {
                    throw new ArgumentException($"Dataset version with ID {datasetVersionId} not found.");
                }

                // Create a TrainingResult entry
                var trainingResult = new Models.TrainingResult
                {
                    DatasetVersionId = datasetVersionId,
                    Status = "Running",
                    CreatedAt = DateTime.UtcNow
                };

                dbContext.TrainingResults.Add(trainingResult);
                await dbContext.SaveChangesAsync();
                
                 // We will run it in a background task to not block the API response
                 _ = Task.Run(async () => await RunTrainingProcessAsync(jarPath, trainingResult.Id));
            }
        }

        private async Task RunTrainingProcessAsync(string jarPath, int resultId)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                var trainingResult = await dbContext.TrainingResults.FindAsync(resultId);
                if (trainingResult == null) return;

                var datasetVersion = await dbContext.DatasetVersions.FindAsync(trainingResult.DatasetVersionId);
                string inputFile = datasetVersion?.FilePath ?? "";
                string? tempFile = null;

                try
                {
                    // Reorder columns if a non-last outcome column is configured
                    if (datasetVersion != null && datasetVersion.OutcomeColumnIndex.HasValue
                        && !string.IsNullOrEmpty(datasetVersion.FilePath)
                        && System.IO.File.Exists(datasetVersion.FilePath))
                    {
                        var cols = datasetVersion.Columns?.Split(',') ?? [];
                        int outcomeIdx = datasetVersion.OutcomeColumnIndex.Value;
                        int lastIdx = cols.Length - 1;

                        if (outcomeIdx != lastIdx)
                        {
                            tempFile = Path.Combine(Path.GetTempPath(), $"intekrator_train_{Guid.NewGuid()}.txt");
                            await ReorderColumnsInFileAsync(datasetVersion.FilePath, tempFile, outcomeIdx);
                            inputFile = tempFile;
                        }
                    }

                    // Define output file path
                    var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Results");
                    Directory.CreateDirectory(outputDir);
                    var outputFile = Path.Combine(outputDir, $"result_{resultId}_{DateTime.UtcNow.Ticks}.txt");

                    trainingResult.FilePath = outputFile;

                    var processStartInfo = new ProcessStartInfo
                    {
                        FileName = "java",
                        Arguments = $"-jar \"{jarPath}\" -learn all \"{inputFile}\" \"{outputFile}\"",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    _logger.LogInformation($"Starting process: java {processStartInfo.Arguments}");

                    using (var process = Process.Start(processStartInfo))
                    {
                        if (process == null)
                        {
                            throw new Exception("Failed to start process.");
                        }

                        var outputTask = process.StandardOutput.ReadToEndAsync();
                        var errorTask = process.StandardError.ReadToEndAsync();

                        await process.WaitForExitAsync();

                        var output = await outputTask;
                        var error = await errorTask;

                        if (process.ExitCode != 0)
                        {
                            throw new Exception($"Process exited with code {process.ExitCode}. Error: {error}");
                        }

                        _logger.LogInformation($"Process output: {output}");
                    }

                    trainingResult.Status = "Completed";
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Training failed for result {resultId}");
                    trainingResult.Status = "Failed";
                    trainingResult.ErrorMessage = ex.Message;
                }
                finally
                {
                    if (tempFile != null && System.IO.File.Exists(tempFile))
                        System.IO.File.Delete(tempFile);

                    await dbContext.SaveChangesAsync();
                }
            }
        }

        private async Task ReorderColumnsInFileAsync(string inputFile, string outputFile, int outcomeIdx)
        {
            var lines = await System.IO.File.ReadAllLinesAsync(inputFile);
            var reordered = lines.Select(line =>
            {
                var cells = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (outcomeIdx >= cells.Length) return line;

                var result = new List<string>();
                for (int i = 0; i < cells.Length; i++)
                    if (i != outcomeIdx) result.Add(cells[i]);
                result.Add(cells[outcomeIdx]);
                return string.Join(" ", result);
            });
            await System.IO.File.WriteAllLinesAsync(outputFile, reordered);
        }

        public async Task<IEnumerable<Models.TrainingResult>> GetResultsByVersionIdAsync(int datasetVersionId)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                return await dbContext.TrainingResults
                    .Where(tr => tr.DatasetVersionId == datasetVersionId)
                    .OrderByDescending(tr => tr.CreatedAt)
                    .ToListAsync();
            }
        }

        public async Task<string> GetResultContentAsync(int resultId)
        {
             using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                var result = await dbContext.TrainingResults.FindAsync(resultId);
                if (result == null) throw new ArgumentException("Result not found");
                
                if (!System.IO.File.Exists(result.FilePath))
                {
                    return "Result file not found on server.";
                }

                return await System.IO.File.ReadAllTextAsync(result.FilePath);
            }
        }
    }
}



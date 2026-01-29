using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InteKRator_UI.Services
{
    public class InferenceService : IInferenceService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<InferenceService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public InferenceService(IConfiguration configuration, ILogger<InferenceService> logger, IServiceScopeFactory scopeFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task<string> InferAsync(int resultId, string state)
        {
            var jarPath = _configuration["TrainingSettings:JarPath"];
            if (string.IsNullOrEmpty(jarPath) || !File.Exists(jarPath))
            {
                throw new InvalidOperationException("Training JAR path is not configured or not found.");
            }

            string resultFilePath;
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                var trainingResult = await dbContext.TrainingResults.FindAsync(resultId);
                
                if (trainingResult == null)
                {
                     throw new ArgumentException($"Training result with ID {resultId} not found.");
                }
                
                if (string.IsNullOrEmpty(trainingResult.FilePath) || !File.Exists(trainingResult.FilePath))
                {
                    throw new FileNotFoundException("Result file not found on server.");
                }
                resultFilePath = trainingResult.FilePath;
            }

            // Command: java -jar InteKRator.jar -infer why STATE INFILE
            // NOTE: The docs say: -infer [why] STATE ... from knowledge base contained in INFILE
            // So arguments: -infer why "state" "infile"
            
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "java",
                Arguments = $"-jar \"{jarPath}\" -infer why {state} \"{resultFilePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            _logger.LogInformation($"Starting inference: java {processStartInfo.Arguments}");

            using (var process = Process.Start(processStartInfo))
            {
                if (process == null)
                {
                    throw new Exception("Failed to start inference process.");
                }

                var outputTask = process.StandardOutput.ReadToEndAsync();
                var errorTask = process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                var output = await outputTask;
                var error = await errorTask;

                if (process.ExitCode != 0)
                {
                    _logger.LogError($"Inference process failed. Exit Code: {process.ExitCode}. Error: {error}");
                    throw new Exception($"Inference execution failed: {error}");
                }

                return output;
            }
        }
    }
}

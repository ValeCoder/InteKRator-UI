using InteKRator_UI.Services;
using Microsoft.AspNetCore.Mvc;

namespace InteKRator_UI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrainingController : ControllerBase
    {
        private readonly ITrainingService _trainingService;
        private readonly ILogger<TrainingController> _logger;

        public TrainingController(ITrainingService trainingService, ILogger<TrainingController> logger)
        {
            _trainingService = trainingService;
            _logger = logger;
        }

        [HttpPost("start/{datasetVersionId}")]
        public async Task<IActionResult> StartTraining(int datasetVersionId)
        {
            try
            {
                _logger.LogInformation($"Received request to start training for version {datasetVersionId}.");
                await _trainingService.StartTrainingAsync(datasetVersionId);
                return Ok(new { message = "Training process started successfully." });
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex) // Catch ArgumentException for missing version
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while starting the training process.");
                return StatusCode(500, new { message = "An error occurred while starting the training process.", details = ex.Message });
            }
        }

        [HttpGet("results/{datasetVersionId}")]
        public async Task<IActionResult> GetResults(int datasetVersionId)
        {
            try
            {
                var results = await _trainingService.GetResultsByVersionIdAsync(datasetVersionId);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving results.");
                return StatusCode(500, new { message = "Error retrieving results." });
            }
        }

        [HttpGet("result/{resultId}/content")]
        public async Task<IActionResult> GetResultContent(int resultId)
        {
            try
            {
                var content = await _trainingService.GetResultContentAsync(resultId);
                return Ok(new { content });
            }
            catch (ArgumentException ex)
            {
                 return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving result content.");
                return StatusCode(500, new { message = "Error retrieving result content." });
            }
        }
    }
}

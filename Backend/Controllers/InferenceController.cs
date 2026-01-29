using System.Threading.Tasks;
using InteKRator_UI.Services;
using Microsoft.AspNetCore.Mvc;

namespace InteKRator_UI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InferenceController : ControllerBase
    {
        private readonly IInferenceService _inferenceService;

        public InferenceController(IInferenceService inferenceService)
        {
            _inferenceService = inferenceService;
        }

        [HttpPost]
        public async Task<IActionResult> Infer([FromBody] InferRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.State))
            {
                return BadRequest("Invalid request state.");
            }

            try
            {
                var result = await _inferenceService.InferAsync(request.ResultId, request.State);
                return Ok(new { Output = result });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }
    }

    public class InferRequest
    {
        public int ResultId { get; set; }
        public string State { get; set; }
    }
}

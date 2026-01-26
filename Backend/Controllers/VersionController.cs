using Microsoft.AspNetCore.Mvc;
using InteKRator_UI.Models;
using InteKRator_UI.Services;

namespace InteKRator_UI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VersionController : ControllerBase
{
    private readonly IVersionService _versionService;

    public VersionController(IVersionService versionService)
    {
        _versionService = versionService;
    }

    [HttpGet("dataset/{datasetId}")]
    public async Task<ActionResult<IEnumerable<DatasetVersion>>> GetVersions(int datasetId)
    {
        var versions = await _versionService.GetVersionsByDatasetIdAsync(datasetId);
        return Ok(versions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DatasetVersion>> GetVersion(int id)
    {
        var version = await _versionService.GetVersionByIdAsync(id);
        if (version == null) return NotFound();
        return Ok(version);
    }

    [HttpPost]
    public async Task<ActionResult<DatasetVersion>> CreateVersion(DatasetVersion version)
    {
        var createdVersion = await _versionService.CreateVersionAsync(version);
        return CreatedAtAction(nameof(GetVersion), new { id = createdVersion.Id }, createdVersion);
    }

    public record CreateManualVersionRequest(int DatasetId, string VersionNumber, string Notes, List<string> Columns, string Content);

    [HttpPost("manual")]
    public async Task<ActionResult<DatasetVersion>> CreateManualVersion(CreateManualVersionRequest request)
    {
        var createdVersion = await _versionService.CreateManualVersionAsync(
            request.DatasetId, request.VersionNumber, request.Notes, request.Columns, request.Content);
        return CreatedAtAction(nameof(GetVersion), new { id = createdVersion.Id }, createdVersion);
    }

    [HttpPost("upload")]
    public async Task<ActionResult<DatasetVersion>> UploadVersion(
        [FromForm] int datasetId, 
        [FromForm] string versionNumber, 
        [FromForm] string notes, 
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("File is empty");
        }

        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".txt" && extension != ".dat")
        {
            return BadRequest("Only .txt and .dat files are allowed");
        }

        using (var stream = file.OpenReadStream())
        {
            var createdVersion = await _versionService.UploadVersionAsync(
                datasetId, versionNumber, notes, file.FileName, stream);
            return CreatedAtAction(nameof(GetVersion), new { id = createdVersion.Id }, createdVersion);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVersion(int id)
    {
        var result = await _versionService.DeleteVersionAsync(id);
        if (!result) return NotFound();
        
        return NoContent();
    }
}

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

    public record CreateManualVersionRequest(int DatasetId, string VersionNumber, string Notes, List<string> Columns, string Content, int? OutcomeColumnIndex = null);

    [HttpPost("manual")]
    public async Task<ActionResult<DatasetVersion>> CreateManualVersion(CreateManualVersionRequest request)
    {
        var createdVersion = await _versionService.CreateManualVersionAsync(
            request.DatasetId, request.VersionNumber, request.Notes, request.Columns, request.Content, request.OutcomeColumnIndex);
        return CreatedAtAction(nameof(GetVersion), new { id = createdVersion.Id }, createdVersion);
    }

    public record CopyVersionRequest(int DatasetId, string VersionNumber, string Notes, int SourceVersionId);

    [HttpPost("copy")]
    public async Task<ActionResult<DatasetVersion>> CopyVersion(CopyVersionRequest request)
    {
        try 
        {
            var createdVersion = await _versionService.CopyVersionAsync(
                request.DatasetId, request.VersionNumber, request.Notes, request.SourceVersionId);
            return CreatedAtAction(nameof(GetVersion), new { id = createdVersion.Id }, createdVersion);
        }
        catch (ArgumentException ex) {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("upload")]
    public async Task<ActionResult<DatasetVersion>> UploadVersion(
        [FromForm] int datasetId,
        [FromForm] string versionNumber,
        [FromForm] string notes,
        IFormFile file,
        [FromForm] bool useFirstRowAsHeader = true,
        [FromForm] string? manualColumns = null,
        [FromForm] int? outcomeColumnIndex = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("File is empty");
        }

        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".txt" && extension != ".dat" && extension != ".csv")
        {
            return BadRequest("Only .txt, .dat and .csv files are allowed");
        }

        using (var stream = file.OpenReadStream())
        {
            var createdVersion = await _versionService.UploadVersionAsync(
                datasetId, versionNumber, notes, file.FileName, stream, useFirstRowAsHeader, manualColumns, outcomeColumnIndex);
            return CreatedAtAction(nameof(GetVersion), new { id = createdVersion.Id }, createdVersion);
        }
    }

    public record UpdateOutcomeColumnRequest(int? OutcomeColumnIndex);

    [HttpPatch("{id}/outcome-column")]
    public async Task<ActionResult<DatasetVersion>> UpdateOutcomeColumn(int id, [FromBody] UpdateOutcomeColumnRequest request)
    {
        var version = await _versionService.UpdateOutcomeColumnIndexAsync(id, request.OutcomeColumnIndex);
        if (version == null) return NotFound();
        return Ok(version);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVersion(int id)
    {
        var result = await _versionService.DeleteVersionAsync(id);
        if (!result) return NotFound();

        return NoContent();
    }
}

using Microsoft.AspNetCore.Mvc;
using InteKRator_UI.Models;
using InteKRator_UI.Services;

namespace InteKRator_UI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatasetController : ControllerBase
{
    private readonly IDatasetService _datasetService;

    public DatasetController(IDatasetService datasetService)
    {
        _datasetService = datasetService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Dataset>>> GetDatasets()
    {
        var datasets = await _datasetService.GetAllDatasetsAsync();
        return Ok(datasets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Dataset>> GetDataset(int id)
    {
        var dataset = await _datasetService.GetDatasetByIdAsync(id);
        if (dataset == null) return NotFound();
        return Ok(dataset);
    }

    [HttpPost]
    public async Task<ActionResult<Dataset>> CreateDataset(Dataset dataset)
    {
        var createdDataset = await _datasetService.CreateDatasetAsync(dataset);
        return CreatedAtAction(nameof(GetDataset), new { id = createdDataset.Id }, createdDataset);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDataset(int id, Dataset dataset)
    {
        if (id != dataset.Id) return BadRequest();
        
        var result = await _datasetService.UpdateDatasetAsync(dataset);
        if (!result) return NotFound();
        
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDataset(int id)
    {
        var result = await _datasetService.DeleteDatasetAsync(id);
        if (!result) return NotFound();
        
        return NoContent();
    }
}

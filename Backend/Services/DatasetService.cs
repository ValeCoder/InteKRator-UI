using Microsoft.EntityFrameworkCore;
using InteKRator_UI.Data;
using InteKRator_UI.Models;

namespace InteKRator_UI.Services;

public class DatasetService : IDatasetService
{
    private readonly AppDbContext _context;

    public DatasetService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Dataset>> GetAllDatasetsAsync()
    {
        return await _context.Datasets.Include(d => d.Versions).ToListAsync();
    }

    public async Task<Dataset?> GetDatasetByIdAsync(int id)
    {
        return await _context.Datasets.Include(d => d.Versions).FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Dataset> CreateDatasetAsync(Dataset dataset)
    {
        _context.Datasets.Add(dataset);
        await _context.SaveChangesAsync();
        return dataset;
    }

    public async Task<bool> UpdateDatasetAsync(Dataset dataset)
    {
        _context.Entry(dataset).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Datasets.Any(e => e.Id == dataset.Id))
            {
                return false;
            }
            throw;
        }
    }

    public async Task<bool> DeleteDatasetAsync(int id)
    {
        var dataset = await _context.Datasets.FindAsync(id);
        if (dataset == null) return false;

        _context.Datasets.Remove(dataset);
        await _context.SaveChangesAsync();
        return true;
    }
}

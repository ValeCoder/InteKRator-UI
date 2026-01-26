using Microsoft.EntityFrameworkCore;
using InteKRator_UI.Data;
using InteKRator_UI.Models;

namespace InteKRator_UI.Services;

public class VersionService : IVersionService
{
    private readonly AppDbContext _context;

    public VersionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DatasetVersion>> GetVersionsByDatasetIdAsync(int datasetId)
    {
        return await _context.DatasetVersions
            .Where(v => v.DatasetId == datasetId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();
    }

    public async Task<DatasetVersion?> GetVersionByIdAsync(int id)
    {
        return await _context.DatasetVersions.FindAsync(id);
    }

    public async Task<DatasetVersion> CreateVersionAsync(DatasetVersion version)
    {
        _context.DatasetVersions.Add(version);
        await _context.SaveChangesAsync();
        return version;
    }

    public async Task<DatasetVersion> UploadVersionAsync(int datasetId, string versionNumber, string notes, string fileName, Stream fileStream)
    {
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(stream);
        }

        var version = new DatasetVersion
        {
            DatasetId = datasetId,
            VersionNumber = versionNumber,
            Notes = notes,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow
        };

        _context.DatasetVersions.Add(version);
        await _context.SaveChangesAsync();
        return version;
    }

    public async Task<bool> DeleteVersionAsync(int id)
    {
        var version = await _context.DatasetVersions.FindAsync(id);
        if (version == null) return false;

        if (File.Exists(version.FilePath))
        {
            File.Delete(version.FilePath);
        }

        _context.DatasetVersions.Remove(version);
        await _context.SaveChangesAsync();
        return true;
    }
}

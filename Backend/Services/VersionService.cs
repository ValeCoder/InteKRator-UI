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

    public async Task<DatasetVersion> CreateManualVersionAsync(int datasetId, string versionNumber, string notes, List<string> columns, string content)
    {
        // Ensure uploads directory exists
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        // Generate unique filename
        var uniqueFileName = $"{Guid.NewGuid()}_manual.txt";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        // Write content to file
        await File.WriteAllTextAsync(filePath, content);

        var version = new DatasetVersion
        {
            DatasetId = datasetId,
            VersionNumber = versionNumber,
            Notes = notes,
            Columns = string.Join(",", columns),
            Content = content,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow
        };

        _context.DatasetVersions.Add(version);
        await _context.SaveChangesAsync();
        return version;
    }

    public async Task<DatasetVersion> CopyVersionAsync(int datasetId, string versionNumber, string notes, int sourceVersionId)
    {
        var sourceVersion = await _context.DatasetVersions.FindAsync(sourceVersionId);
        if (sourceVersion == null)
        {
            throw new ArgumentException("Source version not found");
        }

        // Ensure uploads directory exists
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        // Generate unique filename
        var uniqueFileName = $"{Guid.NewGuid()}_copy.txt";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        // Write content to new file
        // We use sourceVersion.Content because that is the parsed/clean content used for training
        await File.WriteAllTextAsync(filePath, sourceVersion.Content);

        var version = new DatasetVersion
        {
            DatasetId = datasetId,
            VersionNumber = versionNumber,
            Notes = notes,
            Columns = sourceVersion.Columns,
            Content = sourceVersion.Content,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow
        };

        _context.DatasetVersions.Add(version);
        await _context.SaveChangesAsync();
        return version;
    }

    public async Task<DatasetVersion> UploadVersionAsync(int datasetId, string versionNumber, string notes, string fileName, Stream fileStream, bool useFirstRowAsHeader = true, string? manualColumns = null)
    {
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        // Read content first
        using (var reader = new StreamReader(fileStream))
        {
            var rawContent = await reader.ReadToEndAsync();
            var lines = rawContent.Trim().Split('\n').ToList();

            string savedContent = rawContent;
            string columnsStr = "";

            if (useFirstRowAsHeader)
            {
                // Inferred columns
                if (lines.Count > 0)
                {
                    var headerLine = lines[0];
                    columnsStr = string.Join(",", headerLine.Trim().Replace("\t", " ").Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
                    
                    // Remove header from content to avoid duplication in grid
                    lines.RemoveAt(0);
                    savedContent = string.Join("\n", lines);
                }
            }
            else
            {
                // Manual columns
                columnsStr = manualColumns ?? "";
                // Content remains full (first line is data)
            }

            // Save to file (we will save the MODIFIED content without header if stripped, to match DB?)
            // Or should file remain original? Usually file is original. 
            // Let's keep file original on disk for audit, but DB content is what's used for display.
            // Actually, if we download the file later, we might want the original. 
            // But for this task, the DB 'Content' drives the grid.
            await File.WriteAllTextAsync(filePath, rawContent); 

            var version = new DatasetVersion
            {
                DatasetId = datasetId,
                VersionNumber = versionNumber,
                Notes = notes,
                FilePath = filePath,
                Content = savedContent,
                Columns = columnsStr,
                CreatedAt = DateTime.UtcNow
            };

            _context.DatasetVersions.Add(version);
            await _context.SaveChangesAsync();
            return version;
        }
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

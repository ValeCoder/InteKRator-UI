using InteKRator_UI.Models;

namespace InteKRator_UI.Services;

public interface IVersionService
{
    Task<IEnumerable<DatasetVersion>> GetVersionsByDatasetIdAsync(int datasetId);
    Task<DatasetVersion?> GetVersionByIdAsync(int id);
    Task<DatasetVersion> CreateVersionAsync(DatasetVersion version);
    Task<DatasetVersion> CreateManualVersionAsync(int datasetId, string versionNumber, string notes, List<string> columns, string content);
    Task<DatasetVersion> UploadVersionAsync(int datasetId, string versionNumber, string notes, string fileName, Stream fileStream, bool useFirstRowAsHeader = true, string? manualColumns = null);
    Task<bool> DeleteVersionAsync(int id);
}

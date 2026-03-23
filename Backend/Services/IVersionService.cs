using InteKRator_UI.Models;

namespace InteKRator_UI.Services;

public interface IVersionService
{
    Task<IEnumerable<DatasetVersion>> GetVersionsByDatasetIdAsync(int datasetId);
    Task<DatasetVersion?> GetVersionByIdAsync(int id);
    Task<DatasetVersion> CreateVersionAsync(DatasetVersion version);
    Task<DatasetVersion> CreateManualVersionAsync(int datasetId, string versionNumber, string notes, List<string> columns, string content, int? outcomeColumnIndex = null);
    Task<DatasetVersion> CopyVersionAsync(int datasetId, string versionNumber, string notes, int sourceVersionId);
    Task<DatasetVersion> UploadVersionAsync(int datasetId, string versionNumber, string notes, string fileName, Stream fileStream, bool useFirstRowAsHeader = true, string? manualColumns = null, int? outcomeColumnIndex = null);
    Task<bool> DeleteVersionAsync(int id);
    Task<DatasetVersion?> UpdateOutcomeColumnIndexAsync(int versionId, int? outcomeColumnIndex);
}

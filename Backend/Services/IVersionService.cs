using InteKRator_UI.Models;

namespace InteKRator_UI.Services;

public interface IVersionService
{
    Task<IEnumerable<DatasetVersion>> GetVersionsByDatasetIdAsync(int datasetId);
    Task<DatasetVersion?> GetVersionByIdAsync(int id);
    Task<DatasetVersion> CreateVersionAsync(DatasetVersion version);
    Task<DatasetVersion> UploadVersionAsync(int datasetId, string versionNumber, string notes, string fileName, Stream fileStream);
    Task<bool> DeleteVersionAsync(int id);
}

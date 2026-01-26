using InteKRator_UI.Models;

namespace InteKRator_UI.Services;

public interface IDatasetService
{
    Task<IEnumerable<Dataset>> GetAllDatasetsAsync();
    Task<Dataset?> GetDatasetByIdAsync(int id);
    Task<Dataset> CreateDatasetAsync(Dataset dataset);
    Task<bool> UpdateDatasetAsync(Dataset dataset);
    Task<bool> DeleteDatasetAsync(int id);
}

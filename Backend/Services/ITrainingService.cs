using System.Threading.Tasks;

namespace InteKRator_UI.Services
{
    public interface ITrainingService
    {
        Task StartTrainingAsync(int datasetVersionId);
        Task<IEnumerable<InteKRator_UI.Models.TrainingResult>> GetResultsByVersionIdAsync(int datasetVersionId);
        Task<string> GetResultContentAsync(int resultId);
    }
}

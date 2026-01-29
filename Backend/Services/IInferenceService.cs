using System.Threading.Tasks;

namespace InteKRator_UI.Services
{
    public interface IInferenceService
    {
        Task<string> InferAsync(int resultId, string state);
    }
}

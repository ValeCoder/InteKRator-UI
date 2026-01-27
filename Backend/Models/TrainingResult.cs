using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InteKRator_UI.Models;

public class TrainingResult
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int DatasetVersionId { get; set; }

    [ForeignKey("DatasetVersionId")]
    public DatasetVersion DatasetVersion { get; set; } = null!;

    public string FilePath { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? ErrorMessage { get; set; }
}

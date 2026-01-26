using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InteKRator_UI.Models;

public class DatasetVersion
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string VersionNumber { get; set; } = string.Empty;

    public string Notes { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int DatasetId { get; set; }

    [ForeignKey("DatasetId")]
    public Dataset Dataset { get; set; } = null!;
}

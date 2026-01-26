using System.ComponentModel.DataAnnotations;

namespace InteKRator_UI.Models;

public class Dataset
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<DatasetVersion> Versions { get; set; } = new();
}

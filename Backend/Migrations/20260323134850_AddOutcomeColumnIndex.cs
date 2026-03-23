using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteKRator_UI.Migrations
{
    /// <inheritdoc />
    public partial class AddOutcomeColumnIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OutcomeColumnIndex",
                table: "DatasetVersions",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OutcomeColumnIndex",
                table: "DatasetVersions");
        }
    }
}

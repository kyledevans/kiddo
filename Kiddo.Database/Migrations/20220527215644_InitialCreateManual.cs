/* This is where schema changes that involve custom scripts are placed.  For example setting a check constraint on a column cannot
 * currently be accomplished with either EF Core model annotations or Fluent definitions.  By having the initial schema creation in 2
 * separate migrations, it makes it easier for initial development. Because we can use the EF Core tooling to generate 99% of the
 * schema in the *_InitialCreateGenerated.cs migration.  And any additional manually created scripts will be located in the *_InitialCreateManual.cs
 * file.  Since often times the beginning of a project's development will frequently involve dropping and regenerating the database entirely.
 */

namespace Kiddo.Database.Migrations;

using Microsoft.EntityFrameworkCore.Migrations;

public partial class InitialCreateManual : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"ALTER TABLE [Entry] ADD CONSTRAINT CK_Entry_CurrencyLookupId_NonZero CHECK (CurrencyLookupId <> 0);");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"ALTER TABLE [Entry] DROP CONSTRAINT CK_Entry_CurrencyLookupId_NonZero;");
    }
}

================== Template Directions ==================

------- Customization -------
The goal of this project is to serve as an example and a template for a web application that is close to what a real production system may
look like.

------- Database creation -------
Code-first is the assumed development pattern for Entity Framework.  This can be jump-started one time by scaffolding the models from an
existing database.  Check the EF documentation on how to do this.

------- Database schema changes -------
This template uses Entity Framework migrations to manage schema changes.  For detailed information check the EF documentation.  Some commands
that are commonly used (run from the Kiddo.Database directory):

    Create a new migration:
        dotnet ef migrations add --context KiddoDbContext InitialCreateGenerated

    Generate SQL script for schema changes:
        dotnet ef migrations script --context KiddoDbContext --idempotent -o ../Scripts/Install.sql


================== Solution Layout ==================
    Scripts
        * SQL / PowerShell / etc. scripts.
    Solution Items
        * Various config and informative files.
    Kiddo.Core
        * DTOs and constants.
        * The WebContract folder contains all of the DTOs that are sent over the wire from the Kiddo.Web project.
    Kiddo.DAL
        * Data access layer.  Encapsulates Linq and raw SQL queries against the Kiddo database.
    Kiddo.Database
        * Entity Framework model for the database.
    Kiddo.Utility
        * Various helper tools.
    Kiddo.Web
        * Frontend API and React SPA.

================== Development Dependencies ==================

------- Required -------
    * Visual Studio 2022 (Community version is fine).
    * NodeJS 14.x
    * SQL Server database
    * Git
    * .Net 6 SDK (included with Visual Studio 2022)
    * Entity Framework command line tools
        - Install by running from powershell command line: dotnet tool install --global dotnet-ef
        - Update by running from powershell command line: dotnet tool update --global dotnet-ef

------- Optional -------
    * Prometheus
    * Grafana
    * InfluxDb
    * Seq

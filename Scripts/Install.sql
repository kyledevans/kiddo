IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    IF SCHEMA_ID(N'User') IS NULL EXEC(N'CREATE SCHEMA [User];');
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [Account] (
        [AccountId] int NOT NULL IDENTITY,
        [Name] nvarchar(4000) NOT NULL,
        [NameShort] nvarchar(4000) NOT NULL,
        [Description] nvarchar(4000) NULL,
        CONSTRAINT [PK_Account] PRIMARY KEY ([AccountId])
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [LookupType] (
        [LookupTypeId] int NOT NULL,
        [Name] nvarchar(4000) NOT NULL,
        [Description] nvarchar(4000) NOT NULL,
        [SortOrder] int NOT NULL,
        CONSTRAINT [PK_LookupType] PRIMARY KEY ([LookupTypeId])
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[Role] (
        [RoleId] uniqueidentifier NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_Role] PRIMARY KEY ([RoleId])
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[User] (
        [UserId] uniqueidentifier NOT NULL,
        [DisplayName] nvarchar(4000) NOT NULL,
        [GivenName] nvarchar(4000) NULL,
        [Surname] nvarchar(4000) NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_User] PRIMARY KEY ([UserId])
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [Lookup] (
        [LookupId] int NOT NULL,
        [LookupTypeId] int NOT NULL,
        [Name] nvarchar(4000) NOT NULL,
        [NameShort] nvarchar(4000) NOT NULL,
        [Description] nvarchar(4000) NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Lookup] PRIMARY KEY ([LookupId]),
        CONSTRAINT [FK_Lookup_LookupType] FOREIGN KEY ([LookupTypeId]) REFERENCES [LookupType] ([LookupTypeId])
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[RoleClaim] (
        [RoleClaimId] int NOT NULL IDENTITY,
        [RoleId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_RoleClaim] PRIMARY KEY ([RoleClaimId]),
        CONSTRAINT [FK_RoleClaim_Role_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [User].[Role] ([RoleId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[UserAzureAd] (
        [UserAzureAdId] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [GraphId] nvarchar(4000) NOT NULL,
        [DisplayName] nvarchar(4000) NOT NULL,
        [GivenName] nvarchar(4000) NOT NULL,
        [Surname] nvarchar(4000) NOT NULL,
        [Email] nvarchar(4000) NULL,
        CONSTRAINT [PK_UserAzureAd] PRIMARY KEY ([UserAzureAdId]),
        CONSTRAINT [FK_UserAzureAd_User] FOREIGN KEY ([UserId]) REFERENCES [User].[User] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[UserClaim] (
        [UserClaimId] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_UserClaim] PRIMARY KEY ([UserClaimId]),
        CONSTRAINT [FK_UserClaim_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[User] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[UserLogin] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_UserLogin] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_UserLogin_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[User] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[UserRole] (
        [UserId] uniqueidentifier NOT NULL,
        [RoleId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_UserRole] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_UserRole_Role_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [User].[Role] ([RoleId]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserRole_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[User] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [User].[UserToken] (
        [UserId] uniqueidentifier NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_UserToken] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_UserToken_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[User] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE TABLE [Entry] (
        [EntryId] int NOT NULL IDENTITY,
        [CurrencyLookupId] int NOT NULL,
        [AccountId] int NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [DateAddedUtc] datetime2 NOT NULL,
        [Value] int NOT NULL,
        CONSTRAINT [PK_Entry] PRIMARY KEY ([EntryId]),
        CONSTRAINT [FK_Entry_Account] FOREIGN KEY ([AccountId]) REFERENCES [Account] ([AccountId]),
        CONSTRAINT [FK_Entry_Lookup_Currency] FOREIGN KEY ([CurrencyLookupId]) REFERENCES [Lookup] ([LookupId]),
        CONSTRAINT [FK_Entry_User] FOREIGN KEY ([UserId]) REFERENCES [User].[User] ([UserId])
    );
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'LookupTypeId', N'Description', N'Name', N'SortOrder') AND [object_id] = OBJECT_ID(N'[LookupType]'))
        SET IDENTITY_INSERT [LookupType] ON;
    EXEC(N'INSERT INTO [LookupType] ([LookupTypeId], [Description], [Name], [SortOrder])
    VALUES (0, N''Zero'', N''Zero'', 0),
    (1, N''Currency'', N''Currency'', 2),
    (2, N''Security role'', N''Security Role'', 1)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'LookupTypeId', N'Description', N'Name', N'SortOrder') AND [object_id] = OBJECT_ID(N'[LookupType]'))
        SET IDENTITY_INSERT [LookupType] OFF;
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'RoleId', N'ConcurrencyStamp', N'Name', N'NormalizedName') AND [object_id] = OBJECT_ID(N'[User].[Role]'))
        SET IDENTITY_INSERT [User].[Role] ON;
    EXEC(N'INSERT INTO [User].[Role] ([RoleId], [ConcurrencyStamp], [Name], [NormalizedName])
    VALUES (''67876a07-bc53-4c05-9c01-3c8ca59fca21'', N''initialize'', N''Administrator'', N''ADMINISTRATOR''),
    (''84007924-2a1f-40d7-9c70-4eb07754bc36'', N''initialize'', N''ReadOnlyUser'', N''READONLYUSER''),
    (''9a08008c-ae21-4a52-b31e-c27060cf0318'', N''initialize'', N''SuperAdministrator'', N''SUPERADMINISTRATOR''),
    (''f6e96595-1db8-48dc-9786-445ce6d3552c'', N''initialize'', N''User'', N''USER'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'RoleId', N'ConcurrencyStamp', N'Name', N'NormalizedName') AND [object_id] = OBJECT_ID(N'[User].[Role]'))
        SET IDENTITY_INSERT [User].[Role] OFF;
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'LookupId', N'Description', N'IsActive', N'LookupTypeId', N'Name', N'NameShort', N'SortOrder') AND [object_id] = OBJECT_ID(N'[Lookup]'))
        SET IDENTITY_INSERT [Lookup] ON;
    EXEC(N'INSERT INTO [Lookup] ([LookupId], [Description], [IsActive], [LookupTypeId], [Name], [NameShort], [SortOrder])
    VALUES (0, N''Zero'', CAST(0 AS bit), 0, N''Zero'', N''Zero'', 0)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'LookupId', N'Description', N'IsActive', N'LookupTypeId', N'Name', N'NameShort', N'SortOrder') AND [object_id] = OBJECT_ID(N'[Lookup]'))
        SET IDENTITY_INSERT [Lookup] OFF;
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_Entry_AccountId] ON [Entry] ([AccountId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_Entry_CurrencyLookupId] ON [Entry] ([CurrencyLookupId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_Entry_UserId] ON [Entry] ([UserId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_Lookup_LookupTypeId] ON [Lookup] ([LookupTypeId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [User].[Role] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_RoleClaim_RoleId] ON [User].[RoleClaim] ([RoleId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [EmailIndex] ON [User].[User] ([NormalizedEmail]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [User].[User] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_UserAzureAd_UserId] ON [User].[UserAzureAd] ([UserId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_UserClaim_UserId] ON [User].[UserClaim] ([UserId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_UserLogin_UserId] ON [User].[UserLogin] ([UserId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    CREATE INDEX [IX_UserRole_RoleId] ON [User].[UserRole] ([RoleId]);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215600_InitialCreateGenerated')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20220527215600_InitialCreateGenerated', N'6.0.4');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215644_InitialCreateManual')
BEGIN
    ALTER TABLE [Entry] ADD CONSTRAINT CK_Entry_CurrencyLookupId_NonZero CHECK (CurrencyLookupId <> 0);
END;
GO

IF NOT EXISTS(SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20220527215644_InitialCreateManual')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20220527215644_InitialCreateManual', N'6.0.4');
END;
GO

COMMIT;
GO


# InteKRator Dataset Management Documentation

This document explains the architecture and functionality of the Dataset Management and Versioning system implemented in the backend.

## Architecture Overview

The system follows a standard N-Layer architecture:
1.  **Controllers (API Layer)**: Expose RESTful endpoints.
2.  **Services (Business Logic Layer)**: Contain the logic for managing datasets, versions, and file handling.
3.  **Data (Persistence Layer)**: Uses Entity Framework Core with SQLite to store metadata.
4.  **Models (Entities)**: Define the structure of the data.


## Database Schema

We use two main entities:

### 1. Dataset
Represents a collection of related data snapshots.
- `Id`: Primary key.
- `Name`: Display name of the dataset.
- `Description`: Optional details.
- `CreatedAt`: Timestamp.
- `Versions`: Navigation property (One-to-Many relationship with `DatasetVersion`).

### 2. DatasetVersion
Represents a specific snapshot of a dataset.
- `Id`: Primary key.
- `VersionNumber`: Human-readable version (e.g., "1.0.0").
- `Notes`: Changes or details about this version.
- `FilePath`: Path to the actual file stored in the `Uploads/` directory.
- `DatasetId`: Foreign key to `Dataset`.

## Key Workflows

### 1. Dataset CRUD
The `DatasetController` allows creating, reading, updating, and deleting datasets. When a dataset is deleted, all its associated versions are also removed from the database (Cascade Delete).

### 2. Version Management & File Upload
The `VersionController` handles version snapshots. The specialized `upload` endpoint allows sending a file (`.txt` or `.dat`) along with metadata.

**Upload Process:**
1.  Client sends a `multipart/form-data` request to `POST /api/version/upload`.
2.  The controller validates the file extension.
3.  The `VersionService` ensures the `Uploads/` directory exists.
4.  The file is saved with a unique name: `{GUID}_{original_filename}`.
5.  A new `DatasetVersion` record is created in the database, storing the relative file path.

### 3. Automatic Database Initialization
In `Program.cs`, we use `dbContext.Database.EnsureCreated()`. This ensures that on the first run, the SQLite file `datasets.db` is created with all necessary tables automatically.

## API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/dataset` | List all datasets. |
| **POST** | `/api/dataset` | Create a new dataset. |
| **GET** | `/api/version/dataset/{id}` | List all versions for a specific dataset. |
| **POST** | `/api/version/upload` | Upload a new version file (multipart/form-data). |
| **DELETE** | `/api/version/{id}` | Delete a version and its physical file. |

## File Storage
All uploaded files are stored in the `Backend/Uploads/` directory. This directory is automatically created if it doesn't exist.

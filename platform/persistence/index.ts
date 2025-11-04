import { PostgresPersistence, PostgresConfig } from "./structured/postgres";
import { MongoPersistence, MongoConfig } from "./unstructured/mongo";

// Re-export all persistence classes and interfaces
export { Persistence } from "./Persistence";
export { PostgresPersistence, PostgresConfig } from "./structured/postgres";
export { MongoPersistence, MongoConfig } from "./unstructured/mongo";

// Database type enum
export enum DatabaseType {
  POSTGRES = "postgres",
  MONGODB = "mongodb",
}

// Union type for all persistence implementations
export type PersistenceImplementation<T extends Record<string, any>> =
  | PostgresPersistence<T>
  | MongoPersistence<T>;

// Configuration union type
export type PersistenceConfig = PostgresConfig | MongoConfig;

// Factory function options
export interface PersistenceFactoryOptions<
  _T extends Record<string, any> = Record<string, any>
> {
  databaseType: DatabaseType;
  tableOrCollectionName: string;
  config?: PersistenceConfig;
}

/**
 * Factory function to create a persistence implementation based on database type
 * @param options Configuration options for the persistence implementation
 * @returns A new instance of the appropriate persistence class
 */
export function createPersistence<T extends Record<string, any>>(
  options: PersistenceFactoryOptions<T>
): PersistenceImplementation<T> {
  const { databaseType, tableOrCollectionName, config } = options;

  switch (databaseType) {
    case DatabaseType.POSTGRES:
      return new PostgresPersistence<T>(
        tableOrCollectionName,
        config as PostgresConfig
      );

    case DatabaseType.MONGODB:
      return new MongoPersistence<T>(
        tableOrCollectionName,
        config as MongoConfig
      );

    default:
      throw new Error(
        `Unsupported database type: ${databaseType}. Supported types are: ${Object.values(
          DatabaseType
        ).join(", ")}`
      );
  }
}

/**
 * Helper function to create a PostgreSQL persistence instance
 * @param tableName Name of the database table
 * @param config Optional PostgreSQL configuration
 * @returns A new PostgresPersistence instance
 */
export function createPostgresPersistence<T>(
  tableName: string,
  config?: PostgresConfig
): PostgresPersistence<T> {
  return new PostgresPersistence<T>(tableName, config);
}

/**
 * Helper function to create a MongoDB persistence instance
 * @param collectionName Name of the MongoDB collection
 * @param config Optional MongoDB configuration
 * @returns A new MongoPersistence instance
 */
export function createMongoPersistence<T extends Record<string, any>>(
  collectionName: string,
  config?: MongoConfig
): MongoPersistence<T> {
  return new MongoPersistence<T>(collectionName, config);
}

/**
 * Type guard to check if a persistence implementation is PostgreSQL
 * @param persistence The persistence instance to check
 * @returns True if the instance is PostgresPersistence
 */
export function isPostgresPersistence<T extends Record<string, any>>(
  persistence: PersistenceImplementation<T>
): persistence is PostgresPersistence<T> {
  return persistence instanceof PostgresPersistence;
}

/**
 * Type guard to check if a persistence implementation is MongoDB
 * @param persistence The persistence instance to check
 * @returns True if the instance is MongoPersistence
 */
export function isMongoPersistence<T extends Record<string, any>>(
  persistence: PersistenceImplementation<T>
): persistence is MongoPersistence<T> {
  return persistence instanceof MongoPersistence;
}

/**
 * Get the database type from a persistence instance
 * @param persistence The persistence instance to check
 * @returns The database type of the persistence instance
 */
export function getDatabaseType<T extends Record<string, any>>(
  persistence: PersistenceImplementation<T>
): DatabaseType {
  if (isPostgresPersistence(persistence)) {
    return DatabaseType.POSTGRES;
  } else if (isMongoPersistence(persistence)) {
    return DatabaseType.MONGODB;
  } else {
    throw new Error("Unknown persistence implementation type");
  }
}

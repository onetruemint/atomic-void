import { Pool, PoolClient, QueryResult } from "pg";
import { Persistence } from "../Persistence";
import { fetchEnvVar } from "../../utils";

export interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgresPersistence<T> implements Persistence<T> {
  private pool: Pool;
  private tableName: string;

  constructor(tableName: string, config?: PostgresConfig) {
    this.tableName = tableName;

    // Default configuration with environment variable fallbacks
    const defaultConfig: PostgresConfig = {
      host: fetchEnvVar("POSTGRES_HOST", "localhost"),
      port: parseInt(fetchEnvVar("POSTGRES_PORT", "5432")),
      database: fetchEnvVar("POSTGRES_DB", "otm-template"),
      user: fetchEnvVar("POSTGRES_USER", "postgres"),
      password: fetchEnvVar("POSTGRES_PASSWORD", "password"),
      ssl: process.env["NODE_ENV"] === "production",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.pool = new Pool(finalConfig);

    // Handle pool errors
    this.pool.on("error", (err: Error) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  /**
   * Create a new record in the database
   */
  async create(data: T): Promise<string | number | null | undefined> {
    const client = await this.pool.connect();
    try {
      const columns = Object.keys(data as Record<string, any>);
      const values = Object.values(data as Record<string, any>);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(", ")})
        VALUES (${placeholders})
        RETURNING id
      `;

      const result: QueryResult = await client.query(query, values);
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error("Error creating record:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing record in the database
   */
  async update(data: T): Promise<string | number | null | undefined> {
    const client = await this.pool.connect();
    try {
      const dataObj = data as Record<string, any>;
      const { id, ...updateData } = dataObj;

      if (!id) {
        throw new Error("ID is required for update operation");
      }

      const columns = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = columns
        .map((col, index) => `${col} = $${index + 1}`)
        .join(", ");

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $${values.length + 1}
        RETURNING id
      `;

      const result: QueryResult = await client.query(query, [...values, id]);
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error("Error updating record:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert or update a record (upsert)
   */
  async upsert(data: T): Promise<string | number | null | undefined> {
    const client = await this.pool.connect();
    try {
      const dataObj = data as Record<string, any>;
      const { id, ...upsertData } = dataObj;

      if (!id) {
        // If no ID provided, treat as create
        return this.create(data);
      }

      const columns = Object.keys(upsertData);
      const values = Object.values(upsertData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
      const setClause = columns
        .map((col, index) => `${col} = $${index + 1}`)
        .join(", ");

      const query = `
        INSERT INTO ${this.tableName} (id, ${columns.join(", ")})
        VALUES ($${values.length + 1}, ${placeholders})
        ON CONFLICT (id) DO UPDATE SET
        ${setClause}
        RETURNING id
      `;

      const result: QueryResult = await client.query(query, [...values, id]);
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error("Error upserting record:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a record from the database
   */
  async delete(data: T): Promise<string | number | null | undefined> {
    const client = await this.pool.connect();
    try {
      const dataObj = data as Record<string, any>;
      const { id } = dataObj;

      if (!id) {
        throw new Error("ID is required for delete operation");
      }

      const query = `
        DELETE FROM ${this.tableName}
        WHERE id = $1
        RETURNING id
      `;

      const result: QueryResult = await client.query(query, [id]);
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error("Error deleting record:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a record by ID
   */
  async get(id: number | string | null | undefined): Promise<T | null> {
    const client = await this.pool.connect();
    try {
      if (!id) {
        return null;
      }

      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result: QueryResult = await client.query(query, [id]);

      return (result.rows[0] as T) || null;
    } catch (error) {
      console.error("Error getting record:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a custom query
   */
  async query(query: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for transaction management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Health check for the database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

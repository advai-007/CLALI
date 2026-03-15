import { supabase } from '../utils/supabase';
import type { Database } from '../types/supabase';

// Helper type to get the table names
type Tables = keyof Database['public']['Tables'];

// Helper type to get the Row type for a specific table
type Row<T extends Tables> = Database['public']['Tables'][T]['Row'];

// Helper type to get the Insert type for a specific table
type Insert<T extends Tables> = Database['public']['Tables'][T]['Insert'];

// Helper type to get the Update type for a specific table
type Update<T extends Tables> = Database['public']['Tables'][T]['Update'];

// Helper type for tables that have a string 'id' column
type TablesWithId = {
    [K in Tables]: Database['public']['Tables'][K]['Row'] extends { id: string } ? K : never
}[Tables];

export const dbService = {
    /**
     * Fetch all records from a specific table.
     * @param table The name of the table in Supabase
     * @param select The columns to select (defaults to '*')
     */
    async getAll<T extends Tables>(table: T, select = '*') {
        const { data, error } = await supabase
            .from(table)
            .select(select);

        if (error) throw error;
        // Suppress complex union type errors from Supabase client
        return data as unknown as Row<T>[];
    },

    /**
     * Fetch a single record by its ID.
     * @param table The name of the table
     * @param id The ID of the record
     * @param select The columns to select (defaults to '*')
     */
    async getById<T extends TablesWithId>(table: T, id: string, select = '*') {
        const { data, error } = await supabase
            .from(table)
            .select(select)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .eq('id' as any, id)
            .single();

        if (error) throw error;
        return data as unknown as Row<T>;
    },

    /**
     * Create a new record in a table.
     * @param table The name of the table
     * @param payload The data to insert
     */
    async create<T extends Tables>(table: T, payload: Insert<T>) {
        const { data, error } = await supabase
            .from(table)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(payload as any)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Row<T>;
    },

    /**
     * Update an existing record by its ID.
     * @param table The name of the table
     * @param id The ID of the record to update
     * @param payload The new data
     */
    async update<T extends TablesWithId>(table: T, id: string, payload: Update<T>) {
        const { data, error } = await supabase
            .from(table)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(payload as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .eq('id' as any, id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Row<T>;
    },

    /**
     * Delete a record by its ID.
     * @param table The name of the table
     * @param id The ID of the record to delete
     */
    async delete<T extends TablesWithId>(table: T, id: string) {
        const { error } = await supabase
            .from(table)
            .delete()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .eq('id' as any, id);

        if (error) throw error;
        return true;
    }
};

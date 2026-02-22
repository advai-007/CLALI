import { supabase } from '../utils/supabase';

// This is a generic service file for Supabase database operations.
// You can create more specific files later (e.g., studentService.ts) 
// as your application grows.

export const dbService = {
    /**
     * Fetch all records from a specific table.
     * @param table The name of the table in Supabase
     * @param select The columns to select (defaults to '*')
     */
    async getAll(table: string, select = '*') {
        const { data, error } = await supabase
            .from(table)
            .select(select);

        if (error) throw error;
        return data;
    },

    /**
     * Fetch a single record by its ID.
     * @param table The name of the table
     * @param id The ID of the record
     * @param select The columns to select (defaults to '*')
     */
    async getById(table: string, id: string | number, select = '*') {
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new record in a table.
     * @param table The name of the table
     * @param payload The data to insert
     */
    async create(table: string, payload: any) {
        const { data, error } = await supabase
            .from(table)
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an existing record by its ID.
     * @param table The name of the table
     * @param id The ID of the record to update
     * @param payload The new data
     */
    async update(table: string, id: string | number, payload: any) {
        const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a record by its ID.
     * @param table The name of the table
     * @param id The ID of the record to delete
     */
    async delete(table: string, id: string | number) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

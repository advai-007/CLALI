export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            adaptation_events: {
                Row: {
                    action_taken: string
                    created_at: string
                    id: string
                    session_id: string
                    trigger_state: string
                    user_id: string
                }
                Insert: {
                    action_taken: string
                    created_at?: string
                    id?: string
                    session_id: string
                    trigger_state: string
                    user_id: string
                }
                Update: {
                    action_taken?: string
                    created_at?: string
                    id?: string
                    session_id?: string
                    trigger_state?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "adaptation_events_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            classes: {
                Row: {
                    id: string
                    name: string
                    class_code: string
                    teacher_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    class_code: string
                    teacher_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    class_code?: string
                    teacher_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "classes_teacher_id_fkey"
                        columns: ["teacher_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            content_versions: {
                Row: {
                    adaptation_type: string
                    content_text: string
                    created_at: string
                    id: string
                    module_id: string
                }
                Insert: {
                    adaptation_type: string
                    content_text: string
                    created_at?: string
                    id?: string
                    module_id: string
                }
                Update: {
                    adaptation_type?: string
                    content_text?: string
                    created_at?: string
                    id?: string
                    module_id?: string
                }
                Relationships: []
            }
            user_baselines: {
                Row: {
                    id: string
                    mean_value: number
                    metric_name: string
                    std_dev: number
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    id?: string
                    mean_value: number
                    metric_name: string
                    std_dev: number
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    id?: string
                    mean_value?: number
                    metric_name?: string
                    std_dev?: number
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_baselines_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    avatar: string | null
                    class_id: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    parent_id: string | null
                    role: string
                    secret_icon: string | null
                    teacher_id: string | null
                }
                Insert: {
                    avatar?: string | null
                    class_id?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                    parent_id?: string | null
                    role: string
                    secret_icon?: string | null
                    teacher_id?: string | null
                }
                Update: {
                    avatar?: string | null
                    class_id?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    parent_id?: string | null
                    role?: string
                    secret_icon?: string | null
                    teacher_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "users_class_id_fkey"
                        columns: ["class_id"]
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_parent_id_fkey"
                        columns: ["parent_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_teacher_id_fkey"
                        columns: ["teacher_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

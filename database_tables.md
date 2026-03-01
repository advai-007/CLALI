# Database Tables

Based on the Supabase schema definitions, here are all the tables in the database along with their columns:

## `adaptation_events`
- `action_taken` (string)
- `created_at` (string)
- `id` (string)
- `session_id` (string)
- `trigger_state` (string)
- `user_id` (string)
- **Relationships:**
  - `user_id` references `users.id`

## `classes`
- `id` (string)
- `name` (string)
- `class_code` (string)
- `teacher_id` (string)
- `created_at` (string)
- **Relationships:**
  - `teacher_id` references `users.id`

## `content_versions`
- `adaptation_type` (string)
- `content_text` (string)
- `created_at` (string)
- `id` (string)
- `module_id` (string)

## `user_baselines`
- `id` (string)
- `mean_value` (number)
- `metric_name` (string)
- `std_dev` (number)
- `updated_at` (string)
- `user_id` (string)
- **Relationships:**
  - `user_id` references `users.id`

## `users`
- `avatar` (string | null)
- `class_id` (string | null)
- `created_at` (string)
- `full_name` (string | null)
- `id` (string)
- `parent_id` (string | null)
- `role` (string)
- `secret_icon` (string | null)
- `teacher_id` (string | null)
- **Relationships:**
  - `class_id` references `classes.id`
  - `parent_id` references `users.id`
  - `teacher_id` references `users.id`

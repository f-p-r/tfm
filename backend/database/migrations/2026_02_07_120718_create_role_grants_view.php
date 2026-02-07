<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("
            CREATE VIEW role_grants_view AS
            SELECT
                rg.id,
                rg.user_id,
                u.username AS user_username,
                u.name AS user_name,
                rg.role_id,
                r.name AS role_name,
                rg.scope_type,
                CASE
                    WHEN rg.scope_type = 1 THEN 'global'
                    WHEN rg.scope_type = 2 THEN 'association'
                    WHEN rg.scope_type = 3 THEN 'game'
                    ELSE 'unknown'
                END AS scope_type_name,
                rg.scope_id,
                CASE
                    WHEN rg.scope_type = 1 THEN NULL
                    WHEN rg.scope_type = 2 THEN a.name
                    WHEN rg.scope_type = 3 THEN g.name
                    ELSE NULL
                END AS scope_name,
                rg.created_at,
                rg.updated_at
            FROM role_grants rg
            INNER JOIN users u ON rg.user_id = u.id
            INNER JOIN roles r ON rg.role_id = r.id
            LEFT JOIN associations a ON rg.scope_type = 2 AND rg.scope_id = a.id
            LEFT JOIN games g ON rg.scope_type = 3 AND rg.scope_id = g.id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS role_grants_view");
    }
};

<?php

/**
 * Script to add homePageId column to games and associations tables
 * Run with: php add_homepageid.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$db = new PDO('sqlite:' . database_path('database.sqlite'));
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Adding homePageId column to games and associations tables...\n\n";

try {
    // Check if games table needs the column
    $gamesInfo = $db->query("PRAGMA table_info(games)")->fetchAll(PDO::FETCH_ASSOC);
    $gamesHasColumn = false;
    foreach ($gamesInfo as $column) {
        if ($column['name'] === 'homePageId') {
            $gamesHasColumn = true;
            break;
        }
    }

    if (!$gamesHasColumn) {
        echo "Adding homePageId to games table...\n";

        // Get current structure and data
        $db->exec("BEGIN TRANSACTION");

        // Backup data
        $gamesData = $db->query("SELECT * FROM games")->fetchAll(PDO::FETCH_ASSOC);

        // Get current structure
        $createGamesSql = $db->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='games'")->fetchColumn();

        // Drop and recreate table with new column
        $db->exec("DROP TABLE games");
        $db->exec("
            CREATE TABLE games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                slug VARCHAR(64) NOT NULL UNIQUE,
                team_size INTEGER NOT NULL,
                disabled BOOLEAN NOT NULL DEFAULT 0,
                homePageId INTEGER NULL,
                created_at DATETIME,
                updated_at DATETIME
            )
        ");

        // Restore data
        if (!empty($gamesData)) {
            $stmt = $db->prepare("
                INSERT INTO games (id, name, slug, team_size, disabled, created_at, updated_at)
                VALUES (:id, :name, :slug, :team_size, :disabled, :created_at, :updated_at)
            ");
            foreach ($gamesData as $row) {
                $stmt->execute([
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                    'team_size' => $row['team_size'],
                    'disabled' => $row['disabled'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at'],
                ]);
            }

            // Update sqlite_sequence
            $maxId = $db->query("SELECT MAX(id) FROM games")->fetchColumn();
            if ($maxId) {
                $db->exec("UPDATE sqlite_sequence SET seq = $maxId WHERE name = 'games'");
            }
        }

        $db->exec("COMMIT");
        echo "✓ homePageId added to games table\n\n";
    } else {
        echo "✓ games table already has homePageId column\n\n";
    }

    // Check if associations table needs the column
    $associationsInfo = $db->query("PRAGMA table_info(associations)")->fetchAll(PDO::FETCH_ASSOC);
    $associationsHasColumn = false;
    foreach ($associationsInfo as $column) {
        if ($column['name'] === 'homePageId') {
            $associationsHasColumn = true;
            break;
        }
    }

    if (!$associationsHasColumn) {
        echo "Adding homePageId to associations table...\n";

        // Get current structure and data
        $db->exec("BEGIN TRANSACTION");

        // Backup data
        $associationsData = $db->query("SELECT * FROM associations")->fetchAll(PDO::FETCH_ASSOC);

        // Drop and recreate table with new column
        $db->exec("DROP TABLE associations");
        $db->exec("
            CREATE TABLE associations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                shortname VARCHAR(20) UNIQUE,
                slug VARCHAR(64) NOT NULL UNIQUE,
                disabled BOOLEAN NOT NULL DEFAULT 0,
                description TEXT,
                country_id CHAR(2),
                region_id VARCHAR(255),
                web VARCHAR(2048),
                homePageId INTEGER NULL,
                created_at DATETIME,
                updated_at DATETIME
            )
        ");

        // Restore data
        if (!empty($associationsData)) {
            $stmt = $db->prepare("
                INSERT INTO associations (id, name, shortname, slug, disabled, description, country_id, region_id, web, created_at, updated_at)
                VALUES (:id, :name, :shortname, :slug, :disabled, :description, :country_id, :region_id, :web, :created_at, :updated_at)
            ");
            foreach ($associationsData as $row) {
                $stmt->execute([
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'shortname' => $row['shortname'] ?? null,
                    'slug' => $row['slug'],
                    'disabled' => $row['disabled'],
                    'description' => $row['description'] ?? null,
                    'country_id' => $row['country_id'] ?? null,
                    'region_id' => $row['region_id'] ?? null,
                    'web' => $row['web'] ?? null,
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at'],
                ]);
            }

            // Update sqlite_sequence
            $maxId = $db->query("SELECT MAX(id) FROM associations")->fetchColumn();
            if ($maxId) {
                $db->exec("UPDATE sqlite_sequence SET seq = $maxId WHERE name = 'associations'");
            }
        }

        $db->exec("COMMIT");
        echo "✓ homePageId added to associations table\n\n";
    } else {
        echo "✓ associations table already has homePageId column\n\n";
    }

    echo "Done! Verifying structure...\n\n";

    // Show games structure
    echo "Games table structure:\n";
    $gamesInfo = $db->query("PRAGMA table_info(games)")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($gamesInfo as $col) {
        echo "  {$col['cid']}: {$col['name']} ({$col['type']})\n";
    }

    echo "\nAssociations table structure:\n";
    $associationsInfo = $db->query("PRAGMA table_info(associations)")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($associationsInfo as $col) {
        echo "  {$col['cid']}: {$col['name']} ({$col['type']})\n";
    }

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->exec("ROLLBACK");
    }
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n✓ All done!\n";

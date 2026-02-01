<?php

/**
 * Script to migrate media table from databaseOld.sqlite
 * Run with: php migrate_media.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$dbOld = new PDO('sqlite:' . database_path('databaseOld.sqlite'));
$dbOld->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$dbNew = new PDO('sqlite:' . database_path('database.sqlite'));
$dbNew->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Migrating media table from databaseOld.sqlite...\n\n";

try {
    $dbNew->exec("BEGIN TRANSACTION");

    // Clear current media table
    echo "Clearing current media table...\n";
    $dbNew->exec("DELETE FROM media");

    // Get data from old database
    echo "Reading data from databaseOld.sqlite...\n";
    $mediaData = $dbOld->query("SELECT * FROM media")->fetchAll(PDO::FETCH_ASSOC);

    if (empty($mediaData)) {
        echo "No media records found in databaseOld.sqlite\n";
        $dbNew->exec("COMMIT");
        exit(0);
    }

    echo "Found " . count($mediaData) . " media records\n";
    echo "Inserting into current database...\n";

    // Get column names from first row
    $columns = array_keys($mediaData[0]);
    $placeholders = ':' . implode(', :', $columns);
    $columnsList = implode(', ', $columns);

    $stmt = $dbNew->prepare("
        INSERT INTO media ($columnsList)
        VALUES ($placeholders)
    ");

    foreach ($mediaData as $row) {
        $stmt->execute($row);
    }

    // Update sqlite_sequence
    $maxId = $dbNew->query("SELECT MAX(id) FROM media")->fetchColumn();
    if ($maxId) {
        echo "Updating sqlite_sequence to $maxId...\n";

        // Check if entry exists
        $exists = $dbNew->query("SELECT COUNT(*) FROM sqlite_sequence WHERE name = 'media'")->fetchColumn();

        if ($exists) {
            $dbNew->exec("UPDATE sqlite_sequence SET seq = $maxId WHERE name = 'media'");
        } else {
            $dbNew->exec("INSERT INTO sqlite_sequence (name, seq) VALUES ('media', $maxId)");
        }
    }

    $dbNew->exec("COMMIT");

    echo "\n✓ Migration completed successfully!\n";
    echo "  Total media records migrated: " . count($mediaData) . "\n";
    echo "  Next auto-increment ID will be: " . ($maxId + 1) . "\n";

} catch (Exception $e) {
    if ($dbNew->inTransaction()) {
        $dbNew->exec("ROLLBACK");
    }
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

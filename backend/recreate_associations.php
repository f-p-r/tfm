<?php

// Script para recrear la tabla associations con la estructura correcta

$db = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Recreando tabla associations...\n";

// 1. Leer datos actuales
$associations = $db->query("SELECT * FROM associations")->fetchAll(PDO::FETCH_ASSOC);
echo "  - Guardados " . count($associations) . " registros\n";

// 2. Leer relaciones association_game
$associationGames = $db->query("SELECT * FROM association_game")->fetchAll(PDO::FETCH_ASSOC);
echo "  - Guardadas " . count($associationGames) . " relaciones association_game\n";

// 3. Eliminar tabla antigua
$db->exec("DROP TABLE IF EXISTS associations");
echo "  - Tabla antigua eliminada\n";

// 4. Crear tabla nueva con estructura correcta
$db->exec("
CREATE TABLE associations (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name VARCHAR NOT NULL,
    shortname VARCHAR(20) UNIQUE,
    slug VARCHAR(64) NOT NULL UNIQUE,
    disabled TINYINT(1) NOT NULL DEFAULT '0',
    description TEXT,
    country_id VARCHAR(2),
    region_id VARCHAR,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
)
");
echo "  - Tabla nueva creada\n";

// 5. Restaurar datos
foreach ($associations as $assoc) {
    $stmt = $db->prepare("
        INSERT INTO associations (id, name, shortname, slug, disabled, description, country_id, region_id, created_at, updated_at)
        VALUES (:id, :name, :shortname, :slug, :disabled, :description, :country_id, :region_id, :created_at, :updated_at)
    ");
    $stmt->execute([
        ':id' => $assoc['id'],
        ':name' => $assoc['name'],
        ':shortname' => $assoc['shortname'] ?? null,
        ':slug' => $assoc['slug'],
        ':disabled' => $assoc['disabled'],
        ':description' => $assoc['description'] ?? null,
        ':country_id' => $assoc['country_id'] ?? null,
        ':region_id' => $assoc['region_id'] ?? null,
        ':created_at' => $assoc['created_at'],
        ':updated_at' => $assoc['updated_at'],
    ]);
}
echo "  - Restaurados " . count($associations) . " registros\n";

// 6. Actualizar sqlite_sequence
if (count($associations) > 0) {
    $maxId = max(array_column($associations, 'id'));
    $db->exec("UPDATE sqlite_sequence SET seq = $maxId WHERE name = 'associations'");
    echo "  - Actualizado sqlite_sequence\n";
}

// 7. Restaurar relaciones association_game
foreach ($associationGames as $rel) {
    $stmt = $db->prepare("
        INSERT INTO association_game (id, association_id, game_id, created_at, updated_at)
        VALUES (:id, :association_id, :game_id, :created_at, :updated_at)
    ");
    $stmt->execute([
        ':id' => $rel['id'],
        ':association_id' => $rel['association_id'],
        ':game_id' => $rel['game_id'],
        ':created_at' => $rel['created_at'],
        ':updated_at' => $rel['updated_at'],
    ]);
}
echo "  - Restauradas " . count($associationGames) . " relaciones\n";

// 8. Limpiar registros de migraciones que vamos a anular
$migrationsToRemove = [
    '2026_01_30_121734_add_fields_to_associations_table',
    '2026_01_31_192230_add_description_country_region_to_associations_table',
    '2026_01_31_200329_add_shortname_to_associations_table'
];

foreach ($migrationsToRemove as $migration) {
    $db->exec("DELETE FROM migrations WHERE migration = '$migration'");
    echo "  - Eliminado registro de migración: $migration\n";
}

echo "\n✓ Tabla associations recreada exitosamente\n";

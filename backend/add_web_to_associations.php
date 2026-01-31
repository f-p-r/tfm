<?php

// Script para añadir campo web a la tabla associations

$db = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Añadiendo campo web a associations...\n";

// 1. Leer datos actuales
$associations = $db->query("SELECT * FROM associations")->fetchAll(PDO::FETCH_ASSOC);
echo "  - Guardados " . count($associations) . " registros\n";

// 2. Leer relaciones association_game
$associationGames = $db->query("SELECT * FROM association_game")->fetchAll(PDO::FETCH_ASSOC);
echo "  - Guardadas " . count($associationGames) . " relaciones association_game\n";

// 3. Eliminar tabla antigua
$db->exec("DROP TABLE IF EXISTS associations");
echo "  - Tabla antigua eliminada\n";

// 4. Crear tabla nueva con campo web
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
    web VARCHAR(2048),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
)
");
echo "  - Tabla nueva creada con campo web\n";

// 5. Restaurar datos
foreach ($associations as $assoc) {
    $stmt = $db->prepare("
        INSERT INTO associations (id, name, shortname, slug, disabled, description, country_id, region_id, web, created_at, updated_at)
        VALUES (:id, :name, :shortname, :slug, :disabled, :description, :country_id, :region_id, :web, :created_at, :updated_at)
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
        ':web' => null,
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

echo "\n✓ Campo web añadido exitosamente a associations\n";

<?php

/**
 * Script para migrar datos de database_old.sqlite a database.sqlite
 * respetando los IDs originales y actualizando sqlite_sequence
 */

$oldDb = new PDO('sqlite:' . __DIR__ . '/database/database_old.sqlite');
$newDb = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');

$oldDb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$newDb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Tablas a migrar en orden (respetando dependencias)
$tables = ['permissions', 'roles', 'role_has_permissions', 'users', 'role_grants'];

echo "Iniciando migración de datos...\n\n";

foreach ($tables as $table) {
    echo "Migrando tabla: $table\n";

    try {
        // Limpiar tabla actual
        $newDb->exec("DELETE FROM $table");
        echo "  - Tabla limpiada\n";

        // Leer datos de la tabla antigua
        $stmt = $oldDb->query("SELECT * FROM $table");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) {
            echo "  - No hay datos en $table\n";
            continue;
        }

        echo "  - Encontrados " . count($rows) . " registros\n";

        // Obtener nombres de columnas
        $columns = array_keys($rows[0]);
        $placeholders = implode(',', array_fill(0, count($columns), '?'));
        $columnsList = implode(',', $columns);

        // Preparar insert
        $insertSql = "INSERT INTO $table ($columnsList) VALUES ($placeholders)";
        $insertStmt = $newDb->prepare($insertSql);

        // Insertar cada registro
        $inserted = 0;
        foreach ($rows as $row) {
            try {
                $insertStmt->execute(array_values($row));
                $inserted++;
            } catch (PDOException $e) {
                echo "  - Error insertando registro: " . $e->getMessage() . "\n";
            }
        }

        echo "  - Insertados $inserted registros\n";

        // Actualizar sqlite_sequence si la tabla tiene un campo id
        if (in_array('id', $columns)) {
            $maxIdStmt = $oldDb->query("SELECT MAX(id) as max_id FROM $table");
            $maxId = $maxIdStmt->fetch(PDO::FETCH_ASSOC)['max_id'];

            if ($maxId) {
                // Verificar si existe una entrada en sqlite_sequence
                $seqCheck = $newDb->query("SELECT COUNT(*) as cnt FROM sqlite_sequence WHERE name='$table'");
                $exists = $seqCheck->fetch(PDO::FETCH_ASSOC)['cnt'] > 0;

                if ($exists) {
                    $newDb->exec("UPDATE sqlite_sequence SET seq = $maxId WHERE name = '$table'");
                } else {
                    $newDb->exec("INSERT INTO sqlite_sequence (name, seq) VALUES ('$table', $maxId)");
                }

                echo "  - Actualizado sqlite_sequence: próximo ID será " . ($maxId + 1) . "\n";
            }
        }

        echo "  ✓ Completado\n\n";

    } catch (PDOException $e) {
        echo "  ✗ Error: " . $e->getMessage() . "\n\n";
    }
}

echo "Migración completada.\n";

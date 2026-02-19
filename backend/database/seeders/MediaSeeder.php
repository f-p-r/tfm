<?php

namespace Database\Seeders;

use App\Models\Media;
use Illuminate\Database\Seeder;

class MediaSeeder extends Seeder
{
    public function run(): void
    {
        // Global media
        Media::create([
            'scope_type' => 'global',
            'scope_id' => null,
            'url' => '/media/global-logo.png',
            'created_by' => 1,
            'created_at' => now()->subDays(10),
        ]);

        Media::create([
            'scope_type' => 'global',
            'scope_id' => null,
            'url' => '/media/global-banner.jpg',
            'created_by' => 1,
            'created_at' => now()->subDays(8),
        ]);

        // Association 15 media
        Media::create([
            'scope_type' => 'association',
            'scope_id' => 15,
            'url' => '/media/association-15-logo.png',
            'created_by' => 1,
            'created_at' => now()->subDays(5),
        ]);

        Media::create([
            'scope_type' => 'association',
            'scope_id' => 15,
            'url' => '/media/association-15-cover.jpg',
            'created_by' => 1,
            'created_at' => now()->subDays(3),
        ]);

        Media::create([
            'scope_type' => 'association',
            'scope_id' => 15,
            'url' => '/media/association-15-recent.png',
            'created_by' => 1,
            'created_at' => now()->subHours(2),
        ]);

        // Game 5 media
        Media::create([
            'scope_type' => 'game',
            'scope_id' => 5,
            'url' => '/media/game-5-screenshot.png',
            'created_by' => 1,
            'created_at' => now()->subDays(2),
        ]);

        Media::create([
            'scope_type' => 'game',
            'scope_id' => 5,
            'url' => '/media/game-5-poster.jpg',
            'created_by' => 1,
            'created_at' => now()->subHours(1),
        ]);

        // Game 12 media
        Media::create([
            'scope_type' => 'game',
            'scope_id' => 12,
            'url' => '/media/game-12-thumbnail.png',
            'created_by' => 1,
            'created_at' => now()->subDays(7),
        ]);

        // Association 23 media
        Media::create([
            'scope_type' => 'association',
            'scope_id' => 23,
            'url' => '/media/association-23-badge.png',
            'created_by' => 1,
            'created_at' => now()->subDays(4),
        ]);
    }
}

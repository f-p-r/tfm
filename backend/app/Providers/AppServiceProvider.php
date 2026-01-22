<?php

namespace App\Providers;

use App\Models\News;
use App\Policies\NewsPolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Registrar cualquier servicio de aplicación.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap cualquier servicio de aplicación.
     */
    public function boot(): void
    {
        // Registrar políticas
        Gate::policy(News::class, NewsPolicy::class);
    }
}

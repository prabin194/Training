<?php

namespace App\Providers;

use App\Models\Post;
use App\Models\User;
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Post::class, PostPolicy::class);

        // Define role-based gates
        Gate::define('admin', fn (User $user) => $user->isAdmin());
        Gate::define('editor', fn (User $user) => $user->isEditor());
        Gate::define('moderate', fn (User $user) => $user->isAdmin() || $user->isEditor());
        Gate::define('manage-users', fn (User $user) => $user->isAdmin());
    }
}

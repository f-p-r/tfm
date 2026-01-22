<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Redirect;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /** @var array<string> */
    protected array $allowedProviders = ['google', 'facebook'];

    public function redirect(string $provider)
    {
        if (! in_array($provider, $this->allowedProviders, true)) {
            return response()->json(['message' => 'Provider not supported'], 422);
        }

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider)
    {
        if (! in_array($provider, $this->allowedProviders, true)) {
            return response()->json(['message' => 'Provider not supported'], 422);
        }

        // If the provider returned an error, surface it to the frontend
        $providerError = $request->string('error')->toString()
            ?: $request->string('error_reason')->toString()
            ?: $request->string('error_description')->toString();
        if ($providerError) {
            return Redirect::to($this->frontendBase().'/auth/callback?provider='.$provider.'&ok=0&error='.urlencode($providerError));
        }

        // Socialite 5.x validates state automatically
        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $e) {
            return Redirect::to($this->frontendBase().'/auth/callback?provider='.$provider.'&ok=0&error=provider_exception');
        }

        $providerId = (string) ($socialUser->getId() ?? '');
        $email = $socialUser->getEmail();
        $name = $socialUser->getName() ?? $socialUser->getNickname();
        $avatar = $socialUser->getAvatar();

        $user = null;

        if ($providerId !== '') {
            $user = User::where('provider', $provider)
                ->where('provider_id', $providerId)
                ->first();
        }

        if (! $user && $email) {
            $user = User::where('email', $email)->first();
        }

        if (! $user) {
            // Fallback username; ensure uniqueness
            $baseUsername = $socialUser->getNickname() ?: ($name ? preg_replace('/\s+/', '', strtolower($name)) : strtolower($provider).'_'.$providerId);
            $username = $baseUsername ?: strtolower($provider).'_'.$providerId;
            $suffix = 1;
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername.'_'.$suffix++;
            }

            $user = new User();
            $user->name = $name ?: ucfirst($provider).' User';
            $user->username = $username;
            // Email may be null if provider does not provide it; our migration makes it nullable
            $user->email = $email;
        }

        // Update social fields
        $user->provider = $provider;
        $user->provider_id = $providerId ?: null;
        $user->avatar = $avatar ?: null;
        $user->save();

        Auth::login($user);
        $request->session()->regenerate();

        return Redirect::to($this->frontendBase().'/auth/callback?provider='.$provider.'&ok=1');
    }

    private function frontendBase(): string
    {
        $front = (string) env('FRONTEND_URL', env('APP_URL'));
        $front = rtrim($front ?: '', '/');

        $allowedRaw = (string) env('ALLOWED_FRONTEND_URLS', '');
        $allowed = array_values(array_filter(array_map(function ($u) {
            $u = trim($u);
            return $u !== '' ? rtrim($u, '/') : '';
        }, explode(',', $allowedRaw))));

        if (! empty($allowed)) {
            // Only allow redirect to configured list; prefer FRONTEND_URL if it's allowed
            if (in_array($front, $allowed, true)) {
                return $front;
            }
            // Fallback to first allowed entry
            return $allowed[0];
        }

        return $front !== '' ? $front : rtrim((string) env('APP_URL'), '/');
    }
}

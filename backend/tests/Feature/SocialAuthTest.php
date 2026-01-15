<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Session;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Ensure frontend URL and allowed list for predictable redirects
        putenv('FRONTEND_URL=http://localhost:4200');
        putenv('ALLOWED_FRONTEND_URLS=http://localhost:4200');
    }

    public function test_redirect_generates_state_and_redirects()
    {
        $driver = Mockery::mock();
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('with')->with(Mockery::on(function ($arr) {
            return is_array($arr)
                && isset($arr['state'])
                && is_string($arr['state'])
                && preg_match('/^[a-f0-9]{32}$/', $arr['state']) === 1;
        }))->andReturnSelf();
        $driver->shouldReceive('redirect')->andReturn(redirect('https://provider.test/auth'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        $response = $this->get('/api/auth/google/redirect');
        $response->assertStatus(302);
        $response->assertRedirect('https://provider.test/auth');
        $this->assertTrue(Session::has('oauth_state_google'));
    }

    public function test_callback_with_invalid_state_redirects_with_error()
    {
        Session::put('oauth_state_google', 'expected_state');
        $response = $this->get('/api/auth/google/callback?state=wrong_state');
        $response->assertStatus(302);
        $response->assertRedirect('http://localhost:4200/auth/callback?provider=google&ok=0&error=invalid_state');
    }

    public function test_callback_with_provider_error_param_redirects_with_error()
    {
        Session::put('oauth_state_google', 'expected_state');
        $response = $this->get('/api/auth/google/callback?error=access_denied&state=expected_state');
        $response->assertStatus(302);
        $response->assertRedirect('http://localhost:4200/auth/callback?provider=google&ok=0&error=access_denied');
    }
}

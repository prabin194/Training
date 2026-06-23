<?php

namespace Tests\Feature;

use App\Enums\OnboardingStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Registration successful. Please check your email to verify your account.',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'onboarding_status' => 'EMAIL_VERIFICATION',
        ]);

        $this->assertDatabaseHas('otps', [
            'type' => 'email_verification',
        ]);

        Mail::assertSent(\App\Mail\EmailVerificationMail::class);
    }

    public function test_registration_fails_without_uppercase(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_without_lowercase(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'PASSWORD123',
            'password_confirmation' => 'PASSWORD123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_without_number(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Passwordabc',
            'password_confirmation' => 'Passwordabc',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_when_password_contains_name(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John',
            'email' => 'john@example.com',
            'password' => 'John1234',
            'password_confirmation' => 'John1234',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_when_password_contains_name_case_insensitive(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John',
            'email' => 'john@example.com',
            'password' => 'john1234',
            'password_confirmation' => 'john1234',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_succeeds_with_valid_complex_password(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'SecurePass1',
            'password_confirmation' => 'SecurePass1',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
        ]);
    }

    public function test_email_verification(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
            'onboarding_status' => OnboardingStatus::EMAIL_VERIFICATION,
        ]);

        $rawToken = bin2hex(random_bytes(32));
        \App\Models\Otp::create([
            'user_id' => $user->id,
            'code' => Hash::make($rawToken),
            'type' => 'email_verification',
            'expires_at' => now()->addMinutes(60),
        ]);

        $response = $this->postJson('/api/verify-email', [
            'uid' => $user->uid,
            'token' => $rawToken,
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Email verified successfully. You can now log in.']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'onboarding_status' => 'COMPLETED',
        ]);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_login_sends_otp(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
            'onboarding_status' => OnboardingStatus::COMPLETED,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'requires_otp' => true,
            ]);

        $this->assertDatabaseHas('otps', [
            'user_id' => $user->id,
            'type' => 'login',
        ]);

        $this->assertDatabaseHas('login_logs', [
            'user_id' => $user->id,
            'login_successful' => true,
        ]);

        Mail::assertSent(\App\Mail\OtpMail::class);
    }

    public function test_otp_verification(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'onboarding_status' => OnboardingStatus::OTP_VERIFICATION,
        ]);

        $otpCode = '123456';
        \App\Models\Otp::create([
            'user_id' => $user->id,
            'code' => Hash::make($otpCode),
            'type' => 'login',
            'expires_at' => now()->addMinutes(5),
        ]);

        $response = $this->postJson('/api/verify-otp', [
            'uid' => $user->uid,
            'code' => $otpCode,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'onboarding_status' => 'COMPLETED',
        ]);

        $this->assertDatabaseHas('device_logs', [
            'user_id' => $user->id,
        ]);
    }

    public function test_login_fails_with_unverified_email(): void
    {
        $user = User::factory()->unverified()->create([
            'onboarding_status' => OnboardingStatus::EMAIL_VERIFICATION,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJson(['requires_email_verification' => true]);
    }

    public function test_invalid_otp_is_rejected(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        \App\Models\Otp::create([
            'user_id' => $user->id,
            'code' => Hash::make('correct-code'),
            'type' => 'login',
            'expires_at' => now()->addMinutes(5),
        ]);

        $response = $this->postJson('/api/verify-otp', [
            'uid' => $user->uid,
            'code' => '000000',
        ]);

        $response->assertStatus(400);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully.']);
    }

    public function test_can_resend_verification_email(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
            'onboarding_status' => OnboardingStatus::EMAIL_VERIFICATION,
        ]);

        $response = $this->postJson('/api/resend-verification-email', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'A new verification link has been sent to your email.']);

        Mail::assertSent(\App\Mail\EmailVerificationMail::class);
    }

    public function test_resend_verification_rejected_for_verified_email(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/resend-verification-email', [
            'email' => $user->email,
        ]);

        $response->assertStatus(400)
            ->assertJson(['message' => 'Your email is already verified. You can log in.']);
    }

    public function test_resend_verification_hides_unregistered_email(): void
    {
        $response = $this->postJson('/api/resend-verification-email', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'If an account with that email exists, a verification link has been sent.']);
    }
}

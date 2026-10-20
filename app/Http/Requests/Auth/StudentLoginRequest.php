<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StudentLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'login_code' => ['required', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'login_code.required' => 'The login code is required.',
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $code = $this->string('login_code');
        $user = User::where('login_code_hash', User::hashLoginCode($code))->first();

        if (! $user || ! $user->matchesLoginCode($code)) {
            $user?->increment('failed_login_attempts');
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login_code' => trans('auth.failed'),
            ]);
        }

        if (! $user->is_active) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login_code' => 'This account has been deactivated. Contact your driving school.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        $user->forceFill([
            'failed_login_attempts' => 0,
            'last_login_at' => now(),
        ])->save();

        Auth::login($user);
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login_code' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return 'student-login:'.Str::transliterate(Str::lower($this->string('login_code')).'|'.$this->ip());
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                function ($attribute, $value, $fail) {
                    $name = $this->input('name');
                    if ($name && str_contains(strtolower($value), strtolower($name))) {
                        $fail('The password must not contain your name.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'password.regex' => 'The password must include at least one uppercase letter, one lowercase letter, and one number.',
        ];
    }
}

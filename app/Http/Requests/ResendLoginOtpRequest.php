<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResendLoginOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'uid' => ['required', 'string'],
        ];
    }
}

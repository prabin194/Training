<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // 'facebook_page' or 'instagram_business'
            $table->string('provider_account_id'); // Facebook Page ID or Instagram Business Account ID
            $table->string('name'); // Page name or Instagram username
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->json('metadata')->nullable(); // Extra info like profile pic, category, etc.
            $table->timestamps();

            $table->unique(['user_id', 'provider', 'provider_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_connections');
    }
};

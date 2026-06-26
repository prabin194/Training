<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('social_connection_id')->nullable()->constrained()->nullOnDelete();
            $table->string('platform'); // 'facebook' or 'instagram'
            $table->text('content')->nullable(); // Custom content per platform
            $table->string('image_url')->nullable(); // Custom image per platform
            $table->timestamp('scheduled_at');
            $table->string('status')->default('pending'); // pending, processing, published, failed
            $table->text('failure_reason')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_entries');
    }
};

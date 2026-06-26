<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Process due social media schedule entries
Artisan::command('schedule:process', function () {
    $this->call(\App\Console\Commands\ProcessScheduleQueue::class);
})->purpose('Dispatch due social media schedule entries to the queue');

// Run the schedule processor every minute
Schedule::command('schedule:process')->everyMinute()->withoutOverlapping();

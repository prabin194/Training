<?php

namespace App\Console\Commands;

use App\Jobs\PublishToSocialJob;
use App\Models\ScheduleEntry;
use Illuminate\Console\Command;

class ProcessScheduleQueue extends Command
{
    protected $signature = 'schedule:process';
    protected $description = 'Dispatch due social media schedule entries to the queue';

    public function handle(): int
    {
        $entries = ScheduleEntry::pending()
            ->where('scheduled_at', '<=', now())
            ->get();

        $count = 0;

        foreach ($entries as $entry) {
            // Atomic: mark as processing to avoid double-dispatch
            $updated = ScheduleEntry::where('id', $entry->id)
                ->where('status', 'pending')
                ->update(['status' => 'processing']);

            if ($updated) {
                PublishToSocialJob::dispatch($entry->fresh());
                $count++;
            }
        }

        $this->info("Dispatched {$count} schedule entries for publishing.");

        return Command::SUCCESS;
    }
}

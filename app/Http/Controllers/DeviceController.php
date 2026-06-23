<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\DeviceLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $devices = DeviceLog::where('user_id', $request->user()->id)
            ->orderBy('last_activity_at', 'desc')
            ->get();

        return response()->json([
            'devices' => $devices,
        ]);
    }

    public function destroy(Request $request, DeviceLog $deviceLog): JsonResponse
    {
        if ($deviceLog->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $deviceLog->delete();

        ActivityLog::log($request->user(), 'device_revoked', 'Device session revoked.', [
            'device_name' => $deviceLog->device_name,
        ]);

        return response()->json(['message' => 'Device session revoked.']);
    }
}

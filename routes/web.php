<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// SPA catch-all — serve the React app for any route not matched above
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');

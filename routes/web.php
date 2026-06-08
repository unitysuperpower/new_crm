<?php

use App\Http\Controllers\InquiryController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\StreamController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [InquiryController::class, 'index'])->name('dashboard');
    Route::get('inquiries', [InquiryController::class, 'index'])->name('inquiries.index');
    Route::get('programs', [ProgramController::class, 'index'])->name('programs.index');
    Route::post('programs', [ProgramController::class, 'store'])->name('programs.store');
    Route::patch('programs/{program}', [ProgramController::class, 'update'])->name('programs.update');
    Route::delete('programs/{program}', [ProgramController::class, 'destroy'])->name('programs.destroy');
    Route::post('inquiries', [InquiryController::class, 'store'])->name('inquiries.store');
    Route::post('inquiries/import', [InquiryController::class, 'import'])->name('inquiries.import');
    Route::patch('inquiries/assign', [InquiryController::class, 'assign'])->name('inquiries.assign');
    Route::patch('inquiries/{inquiry}', [InquiryController::class, 'update'])->name('inquiries.update');
    Route::post('inquiries/{inquiry}/streams', [StreamController::class, 'store'])->name('inquiries.streams.store');
});

require __DIR__.'/settings.php';

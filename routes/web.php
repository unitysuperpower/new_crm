<?php

use App\Http\Controllers\CampusController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\StreamController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [InquiryController::class, 'index'])->name('dashboard');
    Route::inertia('documentation', 'documentation/index')->name('documentation.index');
    Route::get('documentation/sample-inquiries-upload.csv', function () {
        $path = base_path('sample-inquiries-upload.csv');

        abort_unless(file_exists($path), 404);

        return response()->download($path, 'sample-inquiries-upload.csv', [
            'Content-Type' => 'text/csv',
        ]);
    })->name('documentation.sample-inquiries');
    Route::get('inquiries', [InquiryController::class, 'index'])->name('inquiries.index');
    Route::get('inquiries/report', [InquiryController::class, 'report'])->name('inquiries.report');
    Route::get('inquiries/report/pdf', [InquiryController::class, 'reportPdf'])->name('inquiries.report.pdf');
    Route::get('programs', [ProgramController::class, 'index'])->name('programs.index');
    Route::post('programs', [ProgramController::class, 'store'])->name('programs.store');
    Route::patch('programs/{program}', [ProgramController::class, 'update'])->name('programs.update');
    Route::delete('programs/{program}', [ProgramController::class, 'destroy'])->name('programs.destroy');
    Route::get('campuses', [CampusController::class, 'index'])->name('campuses.index');
    Route::post('campuses', [CampusController::class, 'store'])->name('campuses.store');
    Route::patch('campuses/{campus}/toggle', [CampusController::class, 'toggle'])->name('campuses.toggle');
    Route::patch('campuses/{campus}', [CampusController::class, 'update'])->name('campuses.update');
    Route::delete('campuses/{campus}', [CampusController::class, 'destroy'])->name('campuses.destroy');
    Route::post('inquiries', [InquiryController::class, 'store'])->name('inquiries.store');
    Route::post('inquiries/import', [InquiryController::class, 'import'])->name('inquiries.import');
    Route::patch('inquiries/assign', [InquiryController::class, 'assign'])->name('inquiries.assign');
    Route::patch('inquiries/{inquiry}', [InquiryController::class, 'update'])->name('inquiries.update');
    Route::post('inquiries/{inquiry}/streams', [StreamController::class, 'store'])->name('inquiries.streams.store');
});

require __DIR__.'/settings.php';

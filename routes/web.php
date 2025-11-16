<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\Project;
use App\Http\Controllers\SvgController;


// Home
Route::get('/', function () {
    $projects = Project::all();
  
    if($projects->isEmpty())
    {
        return Inertia::render('welcome-demo');
    }
    else
    {
        $project = $projects->first();
        
       if(!$project->svg_path)
       {
        // upload plan
          return Inertia::render('project-inner-plan', [
               'project' => $project,
           ]);
       }
       else
       {
        // get the current url
        $url = request()->url();
        
          return Inertia::render('project-inner', [
               'project' => $project,
               'url' => $url,
           ]);
       }
    }
})->name('home');


// Create Project
Route::post('/projects', function () {
    $validated = request()->validate([
        'name' => 'required|string|max:255',
        'owner' => 'required|string|max:255',
        'location' => 'required|string|max:255',
        'postcode' => 'required|string|max:20',
        'project_type' => 'required|string|in:residential,commercial,industrial',
        'address' => 'required|string|max:1000',
    ]);
    $project = Project::create($validated);
    return redirect()->route('project.show', $project->id);
})->name('projects.store');


// Show Project
Route::get('/projects/{project}', function (Project $project) {
    $url = request()->url();
      if(!$project->svg_path)
       {
        // upload plan
          return Inertia::render('project-inner-plan', [
               'project' => $project,
           ]);
       }
    return Inertia::render('project-inner', [
        'project' => $project,
        'url' => $url,
    ]);
})->name('project.show');



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');
    Route::get('custom', fn () => Inertia::render('custom'))->name('custom');
});

// API routes for SVG operations
Route::post('/save-svg', [SvgController::class, 'saveSvg']);

require __DIR__.'/settings.php';

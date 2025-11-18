<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\Project;
use App\Models\ProjectPlan;
use App\Http\Controllers\SvgController;


// Home
Route::get('/', function () {
    $projects = Project::all();

    if ($projects->isEmpty()) {
        return Inertia::render('welcome-demo');
    }

    return redirect()->route('projects.index');
})->name('home');


// List Projects
Route::get('/projects', function () {
    $projects = Project::with(['plans' => fn ($query) => $query->orderBy('slot')])
        ->withCount('plans')
        ->get();

    return Inertia::render('projects-index', [
        'projects' => $projects,
    ]);
})->name('projects.index');

// Create Project Form
Route::get('/create-project', function () {
    return Inertia::render('welcome-demo');
})->name('projects.create');

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
    $plan = $project->plans()->create([
        'name' => 'Plan 1',
        'slot' => 1,
        'status' => 'pending_upload',
    ]);
    return redirect()->route('project.plan.show', [$project->id, $plan->id]);
})->name('projects.store');


// Show Project
Route::get('/projects/{project}', function (Project $project) {
    $project->load(['plans' => fn ($query) => $query->orderBy('slot')]);
    $maxPlans = 3;

    return Inertia::render('project-plan-manager', [
        'project' => $project,
        'plans' => $project->plans,
        'maxPlans' => $maxPlans,
    ]);
})->name('project.show');

Route::get('/projects/{project}/plans/{plan}', function (Project $project, ProjectPlan $plan) {
    abort_unless($plan->project_id === $project->id, 404);

    $url = request()->url();

    if (!$plan->svg_path) {
        return Inertia::render('project-inner-plan', [
            'project' => $project,
            'plan' => $plan,
        ]);
    }

    return Inertia::render('project-inner', [
        'project' => $project,
        'plan' => $plan,
        'url' => $url,
    ]);
})->name('project.plan.show');

Route::post('/projects/{project}/plans', function (Request $request, Project $project) {
    $maxPlans = 3;

    if ($project->plans()->count() >= $maxPlans) {
        return response()->json([
            'error' => 'Plan limit reached.',
        ], 422);
    }

    $validated = $request->validate([
        'name' => 'nullable|string|max:255',
    ]);

    $takenSlots = $project->plans()->pluck('slot')->toArray();
    $availableSlot = collect(range(1, $maxPlans))
        ->first(fn ($slot) => !in_array($slot, $takenSlots, true));

    $plan = $project->plans()->create([
        'name' => $validated['name'] ?? "Plan {$availableSlot}",
        'slot' => $availableSlot,
        'status' => 'pending_upload',
    ]);

    return response()->json([
        'message' => 'Plan created.',
        'plan' => $plan,
        'redirect_url' => route('project.plan.show', [$project->id, $plan->id]),
    ], 201);
})->name('project.plans.store');

Route::delete('/projects/{project}/plans/{plan}', function (Project $project, ProjectPlan $plan) {
    abort_unless($plan->project_id === $project->id, 404);

    if ($plan->svg_path) {
        $svgPath = public_path($plan->svg_path);
        if (File::exists($svgPath)) {
            File::delete($svgPath);
        }
    }

    $plan->delete();

    return response()->noContent();
})->name('project.plans.destroy');



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');
    Route::get('custom', fn () => Inertia::render('custom'))->name('custom');
});

// API routes for SVG operations
Route::post('/save-svg', [SvgController::class, 'saveSvg']);









require __DIR__.'/settings.php';



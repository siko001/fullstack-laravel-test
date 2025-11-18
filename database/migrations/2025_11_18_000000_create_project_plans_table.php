<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('slot')->default(1);
            $table->string('status')->default('pending_upload');
            $table->text('svg_path')->nullable();
            $table->timestamps();
            $table->unique(['project_id', 'slot']);
        });

        // Backfill existing project records into project_plans table
        $projects = DB::table('projects')->get();
        foreach ($projects as $project) {
            DB::table('project_plans')->insert([
                'project_id' => $project->id,
                'name' => 'Plan 1',
                'slot' => 1,
                'status' => $project->svg_path ? 'ready' : 'pending_upload',
                'svg_path' => $project->svg_path,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_plans');
    }
};


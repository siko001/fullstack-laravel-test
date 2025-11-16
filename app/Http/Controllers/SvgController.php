<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Project;

class SvgController extends Controller
{
    /**
     * Save SVG content to public directory
     */
    public function saveSvg(Request $request)
    {
        try {
            $validated = $request->validate([
                'filename' => 'required|string',
                'svg' => 'required|string',
                'project_id' => 'required|integer'
            ]);

            $filename = $validated['filename'];
            $svgContent = $validated['svg'];
            
            if (!str_ends_with($filename, '.svg')) {
                $filename .= '.svg';
            }
            $filePath = public_path($filename);
            file_put_contents($filePath, $svgContent);
            
            // Save the path in the database
            $project = Project::where('id', $request->project_id)->first();
            $project->svg_path = $filename;
            $project->save();
          
            // Return JSON response with redirect URL
            return response()->json([
                'message' => 'SVG saved successfully!',
                'redirect_url' => route('project.show', $project->id)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to save SVG: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to save SVG'
            ], 500);
        }
    }
}
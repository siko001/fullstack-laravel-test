<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\ProjectPlan;

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
                'plan_id' => 'required|integer|exists:project_plans,id',
            ]);

            $filename = $validated['filename'];
            $svgContent = $validated['svg'];
            
            if (!str_ends_with($filename, '.svg')) {
                $filename .= '.svg';
            }
            $filePath = public_path($filename);
            file_put_contents($filePath, $svgContent);
            
            $plan = ProjectPlan::with('project')->findOrFail($validated['plan_id']);
            $plan->svg_path = $filename;
            $plan->status = 'ready';
            $plan->save();
          
            return response()->json([
                'message' => 'SVG saved successfully!',
                'redirect_url' => route('project.plan.show', [$plan->project_id, $plan->id]),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to save SVG: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to save SVG'
            ], 500);
        }
    }
}
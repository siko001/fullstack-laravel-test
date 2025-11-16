<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
                'svg' => 'required|string'
            ]);

            $filename = $validated['filename'];
            $svgContent = $validated['svg'];
            if (!str_ends_with($filename, '.svg')) {
                $filename .= '.svg';
            }
            $filePath = public_path($filename);
            file_put_contents($filePath, $svgContent);

            return response()->json([
                'message' => 'SVG saved successfully!',
                'url' => '/' . $filename
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to save SVG: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to save SVG'
            ], 500);
        }
    }

    /**
     * Convert DWG to SVG (placeholder for future implementation)
     */
    public function convertDwgToSvg(Request $request)
    {
        try {
            $file = $request->file('file');
            
            if (!$file) {
                return response()->json(['error' => 'No file provided'], 400);
            }

            // Validate it's a DWG file
            if ($file->getClientOriginalExtension() !== 'dwg') {
                return response()->json(['error' => 'Invalid file type. DWG files only.'], 400);
            }

            // For now, this is a placeholder
            // You would need to implement DWG conversion logic here
            // This could involve calling a external library or service
            
            return response()->json([
                'error' => 'DWG conversion not implemented yet on server side'
            ], 501);

        } catch (\Exception $e) {
            Log::error('DWG conversion error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to convert DWG file'
            ], 500);
        }
    }
}
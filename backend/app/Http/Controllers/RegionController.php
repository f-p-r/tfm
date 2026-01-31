<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;

class RegionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $regions = Region::all();

        return response()->json($regions);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $region = Region::find($id);

        if (!$region) {
            return response()->json(['message' => 'Region not found'], 404);
        }

        return response()->json($region);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\SiteParam;
use Illuminate\Http\JsonResponse;

class PublicSiteParamsController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $param = SiteParam::query()->find($id);

        if (! $param) {
            return response()->json(['message' => 'Site param not found.'], 404);
        }

        return response()->json([
            'id' => $param->id,
            'value' => $param->value,
        ]);
    }
}

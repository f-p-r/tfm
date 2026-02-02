<?php

namespace App\Http\Controllers;

use App\Http\Requests\SiteParamUpsertRequest;
use App\Models\SiteParam;
use Illuminate\Http\JsonResponse;

class AdminSiteParamsController extends Controller
{
    public function upsert(SiteParamUpsertRequest $request): JsonResponse
    {
        $param = SiteParam::query()->updateOrCreate(
            ['id' => $request->getId()],
            ['value' => $request->getValue()]
        );

        return response()->json([
            'id' => $param->id,
            'value' => $param->value,
            'createdAt' => $param->created_at?->toISOString(),
            'updatedAt' => $param->updated_at?->toISOString(),
        ]);
    }
}

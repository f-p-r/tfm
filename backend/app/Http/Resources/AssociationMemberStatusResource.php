<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssociationMemberStatusResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'association_id' => $this->association_id,
            'type' => $this->type,
            'order' => $this->order,
            'name' => $this->name,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'association' => $this->whenLoaded('association', fn() => [
                'id' => $this->association->id,
                'name' => $this->association->name,
                'slug' => $this->association->slug,
            ]),
            'status_type' => $this->whenLoaded('statusType', fn() => [
                'id' => $this->statusType->id,
                'name' => $this->statusType->name,
            ]),
        ];
    }
}

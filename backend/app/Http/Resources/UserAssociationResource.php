<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserAssociationResource extends JsonResource
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
            'user_id' => $this->user_id,
            'association_id' => $this->association_id,
            'association_user_id' => $this->association_user_id,
            'joined_at' => $this->joined_at?->format('Y-m-d'),
            'status_id' => $this->status_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'email' => $this->user->email,
            ]),
            'association' => $this->whenLoaded('association', fn() => [
                'id' => $this->association->id,
                'name' => $this->association->name,
                'slug' => $this->association->slug,
                'shortname' => $this->association->shortname,
            ]),
            'status' => $this->whenLoaded('status', fn() => $this->status ? [
                'id' => $this->status->id,
                'name' => $this->status->name,
                'order' => $this->status->order,
                'type' => $this->status->whenLoaded('statusType', fn() => [
                    'id' => $this->status->statusType->id,
                    'name' => $this->status->statusType->name,
                ]),
            ] : null),
        ];
    }
}

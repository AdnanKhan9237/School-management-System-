<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreParentRequest;
use App\Http\Resources\ParentResource;
use App\Http\Resources\StudentResource;
use App\Models\User;
use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ParentController extends Controller
{
    public function __construct(private readonly StudentService $students) {}

    public function index(Request $request): JsonResponse
    {
        $parents = User::where('role', 'parent')
            ->withCount('children')
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->latest('created_at')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => ParentResource::collection($parents->items()),
            'meta' => [
                'current_page' => $parents->currentPage(),
                'per_page' => $parents->perPage(),
                'total' => $parents->total(),
                'last_page' => $parents->lastPage(),
            ],
        ]);
    }

    public function store(StoreParentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $parent = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'] ?? Str::password(10),
            'role' => 'parent',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Parent account created successfully.',
            'data' => new ParentResource($parent),
        ], 201);
    }

    public function children(User $parent): JsonResponse
    {
        abort_unless($parent->role === 'parent', 404, 'Parent not found.');

        $children = $parent->children()->with(['user', 'schoolClass'])->get();
        $this->students->attachStats($children);

        return response()->json([
            'success' => true,
            'data' => StudentResource::collection($children),
        ]);
    }
}

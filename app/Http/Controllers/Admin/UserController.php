<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const SORTABLE = ['name', 'email', 'last_login_at', 'created_at'];

    public function index(Request $request): Response
    {
        return Inertia::render('Users/Index', [
            'users' => $this->query($request)
                ->paginate(10)
                ->withQueryString()
                ->through(fn (User $user) => $this->summary($user)),
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'status' => $this->choice($request, 'status', ['active', 'inactive']),
                'sort' => in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at',
                'direction' => $request->query('direction') === 'asc' ? 'asc' : 'desc',
            ],
            'stats' => [
                'total' => $this->admins()->count(),
                'active' => $this->admins()->where('is_active', true)->count(),
                'inactive' => $this->admins()->where('is_active', false)->count(),
                'signedIn' => $this->admins()->whereNotNull('last_login_at')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules($request));

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'admin',
            'is_active' => true,
        ]);

        return redirect()->route('users.index')->with('success', 'created');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate($this->rules($request, $user));

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        return redirect()->route('users.index')->with('success', 'updated');
    }

    public function toggleActive(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->withErrors(['status' => 'You cannot deactivate the account you are signed in with.']);
        }

        if ($user->is_active && $this->wouldLoseLastAdmin($user)) {
            return back()->withErrors(['status' => 'Keep at least one active administrator.']);
        }

        $wasActive = $user->is_active;
        $user->update(['is_active' => ! $wasActive]);

        return back()->with('success', $wasActive ? 'deactivated' : 'activated');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->withErrors(['users' => 'You cannot delete the account you are signed in with.']);
        }

        if ($this->wouldLoseLastAdmin($user)) {
            return back()->withErrors(['users' => 'Keep at least one active administrator.']);
        }

        try {
            $user->delete();
        } catch (QueryException) {
            return back()->withErrors(['users' => 'This account still has records attached. Deactivate it instead.']);
        }

        return back()->with('success', 'deleted');
    }

    private function query(Request $request)
    {
        $sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $search = trim((string) $request->query('search', ''));
        $status = $this->choice($request, 'status', ['active', 'inactive']);

        return $this->admins()
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

                $query->where(fn ($inner) => $inner->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->when($status, fn ($query) => $query->where('is_active', $status === 'active'))
            ->orderBy($sort, $direction)
            ->orderBy('id');
    }

    private function summary(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'isActive' => $user->is_active,
            'hasPassword' => $user->password !== null,
            'lastLoginAt' => $user->last_login_at?->toIso8601String(),
            'createdAt' => $user->created_at?->toDateString(),
        ];
    }

    private function rules(Request $request, ?User $user = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique(User::class, 'email')->ignore($user?->id),
            ],
            'password' => [
                Rule::requiredIf(fn () => $user === null || $user->password === null),
                'nullable', 'string', 'confirmed', 'min:8',
            ],
        ];
    }

    private function admins()
    {
        return User::query()->where('role', 'admin');
    }

    /**
     * An admin must never be able to remove the only account that can sign in to this screen.
     */
    private function wouldLoseLastAdmin(User $user): bool
    {
        return $user->is_active
            && $this->admins()->where('is_active', true)->whereKeyNot($user->id)->doesntExist();
    }

    private function choice(Request $request, string $key, array $allowed): ?string
    {
        $value = $request->query($key);

        return in_array($value, $allowed, true) ? $value : null;
    }
}

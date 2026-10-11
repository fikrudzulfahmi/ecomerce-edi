<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController
{
    public function index(Request $request): JsonResponse
    {
        $conversations = $request->user()->conversations()
            ->withCount(['messages as unread' => fn ($q) => $q->where('sender', 'admin')->whereNull('read_at')])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn (Conversation $c) => [
                'id' => $c->id,
                'subject' => $c->subject,
                'last_message_at' => $c->last_message_at?->toISOString(),
                'unread' => $c->unread ?? 0,
            ]);

        return response()->json(['data' => $conversations]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $conversation = $request->user()->conversations()->create([
            'subject' => $request->input('subject'),
            'last_message_at' => now(),
        ]);

        $message = $conversation->messages()->create([
            'sender' => 'user',
            'content' => $request->input('content'),
        ]);

        return response()->json([
            'data' => [
                'id' => $conversation->id,
                'message' => $this->formatMessage($message),
            ],
        ], 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize($request, $conversation);

        $conversation->messages()
            ->where('sender', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => $conversation->messages()->orderBy('id')->get()->map(fn ($m) => $this->formatMessage($m)),
        ]);
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize($request, $conversation);

        $request->validate(['content' => ['required', 'string', 'max:2000']]);

        $message = $conversation->messages()->create([
            'sender' => 'user',
            'content' => $request->input('content'),
        ]);
        $conversation->update(['last_message_at' => now()]);

        return response()->json(['data' => $this->formatMessage($message)], 201);
    }

    private function authorize(Request $request, Conversation $conversation): void
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }
    }

    private function formatMessage($m): array
    {
        return [
            'id' => $m->id,
            'sender' => $m->sender,
            'content' => $m->content,
            'created_at' => $m->created_at?->toISOString(),
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController
{
    public function index(): JsonResponse
    {
        $conversations = Conversation::with('user:id,name')
            ->withCount(['messages as unread' => fn ($q) => $q->where('sender', 'user')->whereNull('read_at')])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn (Conversation $c) => [
                'id' => $c->id,
                'subject' => $c->subject,
                'user' => $c->user?->name,
                'last_message_at' => $c->last_message_at?->toISOString(),
                'unread' => $c->unread ?? 0,
            ]);

        return response()->json(['data' => $conversations]);
    }

    public function messages(Conversation $conversation): JsonResponse
    {
        $conversation->messages()
            ->where('sender', 'user')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => $conversation->messages()->orderBy('id')->get()->map(fn ($m) => $this->format($m)),
        ]);
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate(['content' => ['required', 'string', 'max:2000']]);

        $message = $conversation->messages()->create([
            'sender' => 'admin',
            'content' => $request->input('content'),
        ]);
        $conversation->update(['last_message_at' => now()]);

        return response()->json(['data' => $this->format($message)], 201);
    }

    private function format($m): array
    {
        return [
            'id' => $m->id,
            'sender' => $m->sender,
            'content' => $m->content,
            'created_at' => $m->created_at?->toISOString(),
        ];
    }
}

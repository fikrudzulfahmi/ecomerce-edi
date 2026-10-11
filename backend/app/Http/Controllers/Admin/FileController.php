<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FileController
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,epub'],
        ]);

        $file = $request->file('file');
        $name = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('ebooks', $name, 'local');

        return response()->json(['path' => $path], 201);
    }
}

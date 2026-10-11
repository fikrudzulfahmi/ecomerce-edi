<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('digital_file')->nullable()->after('images');
            $table->unsignedBigInteger('bundle_physical_id')->nullable()->after('digital_file');
            $table->foreign('bundle_physical_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['bundle_physical_id']);
            $table->dropColumn(['digital_file', 'bundle_physical_id']);
        });
    }
};

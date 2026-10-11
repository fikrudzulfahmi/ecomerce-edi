<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('type'); // free_shipping | discount_fixed | discount_percent
            $table->unsignedInteger('value')->default(0);
            $table->unsignedInteger('min_order')->default(0);
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('handling_fee')->default(0)->after('shipping_cost');
            $table->foreignId('voucher_id')->nullable()->after('handling_fee')->constrained('vouchers')->nullOnDelete();
            $table->string('voucher_code')->nullable()->after('voucher_id');
            $table->unsignedInteger('discount_amount')->default(0)->after('voucher_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voucher_id');
            $table->dropColumn(['handling_fee', 'voucher_code', 'discount_amount']);
        });
        Schema::dropIfExists('settings');
        Schema::dropIfExists('vouchers');
    }
};

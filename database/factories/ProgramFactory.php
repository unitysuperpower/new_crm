<?php

namespace Database\Factories;

use App\Models\Campus;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Program>
 */
class ProgramFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'campus_id' => Campus::factory(),
            'name' => fake()->unique()->words(3, true),
            'duration' => fake()->randomElement(['3 Months', '6 Months', '4 Years']),
            'fee' => fake()->numberBetween(25000, 150000),
        ];
    }
}

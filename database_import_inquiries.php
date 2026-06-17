<?php

declare(strict_types=1);

$oldPath = 'C:\\Users\\NEW PC\\Downloads\\old_database.sql';
$newPath = 'C:\\Users\\NEW PC\\Downloads\\new_database.sql';
$outPath = __DIR__.DIRECTORY_SEPARATOR.'old_inquiries_to_new_import.sql';

function parseInsertRows(string $sql, string $table): array
{
    preg_match_all(
        '/INSERT INTO `'.preg_quote($table, '/').'` \((.*?)\) VALUES\s*(.*?);/s',
        $sql,
        $matches,
        PREG_SET_ORDER,
    );

    $rows = [];

    foreach ($matches as $match) {
        preg_match_all('/`([^`]+)`/', $match[1], $columnMatches);
        $columns = $columnMatches[1];

        foreach (parseTuples($match[2]) as $tuple) {
            $values = parseValues($tuple);
            $rows[] = array_combine($columns, $values);
        }
    }

    return $rows;
}

function parseTuples(string $values): array
{
    $tuples = [];
    $length = strlen($values);
    $inString = false;
    $escaped = false;
    $depth = 0;
    $buffer = '';

    for ($i = 0; $i < $length; $i++) {
        $char = $values[$i];

        if ($inString) {
            $buffer .= $char;

            if ($escaped) {
                $escaped = false;
            } elseif ($char === '\\') {
                $escaped = true;
            } elseif ($char === "'") {
                $inString = false;
            }

            continue;
        }

        if ($char === "'") {
            $inString = true;
            $buffer .= $char;
            continue;
        }

        if ($char === '(') {
            if ($depth > 0) {
                $buffer .= $char;
            }

            $depth++;
            continue;
        }

        if ($char === ')') {
            $depth--;

            if ($depth === 0) {
                $tuples[] = trim($buffer);
                $buffer = '';
                continue;
            }

            $buffer .= $char;
            continue;
        }

        if ($depth > 0) {
            $buffer .= $char;
        }
    }

    return $tuples;
}

function parseValues(string $tuple): array
{
    $values = [];
    $length = strlen($tuple);
    $inString = false;
    $escaped = false;
    $buffer = '';

    for ($i = 0; $i < $length; $i++) {
        $char = $tuple[$i];

        if ($inString) {
            $buffer .= $char;

            if ($escaped) {
                $escaped = false;
            } elseif ($char === '\\') {
                $escaped = true;
            } elseif ($char === "'") {
                $inString = false;
            }

            continue;
        }

        if ($char === "'") {
            $inString = true;
            $buffer .= $char;
            continue;
        }

        if ($char === ',') {
            $values[] = decodeSqlValue($buffer);
            $buffer = '';
            continue;
        }

        $buffer .= $char;
    }

    $values[] = decodeSqlValue($buffer);

    return $values;
}

function decodeSqlValue(string $value): ?string
{
    $value = trim($value);

    if (strcasecmp($value, 'NULL') === 0) {
        return null;
    }

    if (strlen($value) >= 2 && $value[0] === "'" && substr($value, -1) === "'") {
        $value = substr($value, 1, -1);
        $value = strtr($value, [
            "\\'" => "'",
            '\\"' => '"',
            '\\\\' => '\\',
            '\\n' => "\n",
            '\\r' => "\r",
            '\\t' => "\t",
            '\\0' => "\0",
        ]);
    }

    return $value;
}

function sqlValue(mixed $value): string
{
    if ($value === null || $value === '') {
        return 'NULL';
    }

    return "'".strtr((string) $value, [
        "\\" => "\\\\",
        "'" => "\\'",
        "\0" => "\\0",
        "\n" => "\\n",
        "\r" => "\\r",
        "\t" => "\\t",
    ])."'";
}

function limitText(?string $value, int $limit): ?string
{
    if ($value === null) {
        return null;
    }

    $value = trim($value);
    if ($value === '') {
        return null;
    }

    return mb_strlen($value) > $limit ? mb_substr($value, 0, $limit) : $value;
}

function normalizeStatus(?string $status): string
{
    $key = strtolower(trim((string) $status));
    $key = str_replace([' / ', '/ '], '/', $key);

    return match ($key) {
        'not sure' => 'not sure',
        'not interested' => 'not interested',
        'not eligible' => 'not eligible',
        'interested' => 'interested',
        'call back' => 'call back',
        'distance problem' => 'distance problem',
        'not responding' => 'not responding',
        'for job' => 'for job',
        'will visit' => 'will visit',
        'visited' => 'visited',
        'p.o', 'po' => 'p.o',
        'online/short course' => 'online/short course',
        'e-t paid' => 'e-t paid',
        'admission fee paid' => 'admission fee paid',
        'master classes' => 'master classes',
        default => 'pending',
    };
}

function normalizeDate(?string $date): ?string
{
    if ($date === null || trim($date) === '') {
        return null;
    }

    $date = trim($date);
    if ($date === '0000-00-00' || !preg_match('/^(\d{4})-\d{2}-\d{2}$/', $date, $matches)) {
        return null;
    }

    return ((int) $matches[1]) >= 1000 ? $date : null;
}

function rowById(array $rows): array
{
    $map = [];

    foreach ($rows as $row) {
        $map[(int) $row['id']] = $row;
    }

    return $map;
}

function latestByInquiry(array $rows, string $dateColumn = 'created_at'): array
{
    $latest = [];

    foreach ($rows as $row) {
        $id = (int) $row['inquiry_id'];

        if (!isset($latest[$id]) || strcmp((string) $row[$dateColumn], (string) $latest[$id][$dateColumn]) >= 0) {
            $latest[$id] = $row;
        }
    }

    return $latest;
}

$oldSql = file_get_contents($oldPath);
$newSql = file_get_contents($newPath);

$oldInquiries = parseInsertRows($oldSql, 'inquiries');
$oldFollowUps = parseInsertRows($oldSql, 'inquiry_follow_ups');
$oldRemarks = parseInsertRows($oldSql, 'inquiry_remarks');
$oldAssignments = parseInsertRows($oldSql, 'inquiry_assignments');
$oldUsers = parseInsertRows($oldSql, 'users');
$newUsers = parseInsertRows($newSql, 'users');
$cities = rowById(parseInsertRows($oldSql, 'cities'));
$campuses = rowById(parseInsertRows($oldSql, 'campuses'));
$sources = rowById(parseInsertRows($oldSql, 'inquiry_types'));

$newUsersByEmail = [];
$superAdminId = null;
foreach ($newUsers as $user) {
    $newUsersByEmail[strtolower((string) $user['email'])] = (int) $user['id'];

    if ($superAdminId === null && (string) $user['role'] === 'super_admin') {
        $superAdminId = (int) $user['id'];
    }
}
$superAdminId ??= 101;

$forcedUserMap = [
    // Old CRM user IDs to new CRM user IDs.
    // Hira was user 2 in the old CRM and is user 103 in the new CRM.
    // Suraiya was user 3 in the old CRM and is user 104 in the new CRM.
    2 => 103,
    3 => 104,
];

$userMap = $forcedUserMap;
foreach ($oldUsers as $user) {
    if (isset($forcedUserMap[(int) $user['id']])) {
        continue;
    }

    $email = strtolower((string) $user['email']);

    if (isset($newUsersByEmail[$email])) {
        $userMap[(int) $user['id']] = $newUsersByEmail[$email];
        continue;
    }

    if (strtolower((string) $user['name']) === 'super admin') {
        $userMap[(int) $user['id']] = $superAdminId;
    }
}

$latestFollowUp = latestByInquiry($oldFollowUps);
$latestAssignment = latestByInquiry($oldAssignments);

$inquiryIds = array_map(fn (array $row): int => (int) $row['id'], $oldInquiries);
$validInquiryIds = array_flip($inquiryIds);

$sql = [];
$sql[] = '-- Generated import for old CRM inquiries and discussion streams.';
$sql[] = '-- Source: '.$oldPath;
$sql[] = '-- Target: new CRM inquiries + streams only.';
$sql[] = 'SET FOREIGN_KEY_CHECKS=0;';
$sql[] = 'START TRANSACTION;';
$sql[] = '';

$inquiryColumns = [
    'id',
    'name',
    'phone',
    'email',
    'city',
    'address',
    'source',
    'program_id',
    'previous_program',
    'campus',
    'campus_id',
    'status',
    'assigned_user_id',
    'assigned_at',
    'department',
    'postal_communication',
    'next_follow_up_at',
    'last_activity_at',
    'message',
    'created_at',
    'updated_at',
];

$inquiryValues = [];
foreach ($oldInquiries as $row) {
    $oldId = (int) $row['id'];
    $status = normalizeStatus($row['status']);
    $assignedUserId = $userMap[(int) ($row['assigned_to'] ?? 0)] ?? null;
    $city = isset($cities[(int) ($row['city_id'] ?? 0)]) ? $cities[(int) $row['city_id']]['name'] : null;
    $campus = isset($campuses[(int) ($row['campus_id'] ?? 0)]) ? $campuses[(int) $row['campus_id']]['name'] : null;
    $source = isset($sources[(int) ($row['inquiry_type_id'] ?? 0)]) ? $sources[(int) $row['inquiry_type_id']]['name'] : null;
    $followUp = $latestFollowUp[$oldId] ?? null;
    $assignment = $latestAssignment[$oldId] ?? null;
    $lastActivityAt = $followUp['created_at'] ?? $row['updated_at'];

    $messageParts = [];
    if ($row['remarks'] !== null && trim((string) $row['remarks']) !== '') {
        $messageParts[] = (string) $row['remarks'];
    }
    if ($row['remarks'] !== null && mb_strlen((string) $row['remarks']) > 255) {
        $messageParts[] = 'Full previous program: '.$row['remarks'];
    }
    if (normalizeStatus($row['status']) !== strtolower((string) $row['status'])) {
        $messageParts[] = 'Old CRM status: '.$row['status'];
    }
    if ($row['father_name'] !== null && !in_array(strtolower((string) $row['father_name']), ['na', 'n/a'], true)) {
        $messageParts[] = 'Father name: '.$row['father_name'];
    }

    $values = [
        $oldId,
        $row['student_name'],
        $row['mobile'] ?: 'unknown-'.$oldId,
        $row['email'],
        $city,
        null,
        $source,
        null,
        limitText($row['remarks'], 255),
        $campus,
        null,
        $status,
        $assignedUserId,
        $assignment['created_at'] ?? ($assignedUserId ? $row['created_at'] : null),
        'admission',
        'pending',
        normalizeDate($followUp['next_follow_up'] ?? null),
        $lastActivityAt,
        implode("\n", $messageParts) ?: null,
        $row['created_at'],
        $row['updated_at'],
    ];

    $inquiryValues[] = '('.implode(', ', array_map('sqlValue', $values)).')';
}

if ($inquiryValues !== []) {
    $sql[] = 'INSERT INTO `inquiries` (`'.implode('`, `', $inquiryColumns).'`) VALUES';
    $sql[] = implode(",\n", $inquiryValues).';';
    $sql[] = '';
}

$streamColumns = ['response', 'user_id', 'inquiry_id', 'last_status', 'created_at', 'updated_at'];
$streamValues = [];

foreach ($oldFollowUps as $row) {
    $inquiryId = (int) $row['inquiry_id'];
    if (!isset($validInquiryIds[$inquiryId]) || trim((string) $row['response']) === '') {
        continue;
    }

    $streamValues[] = '('.implode(', ', array_map('sqlValue', [
        $row['response'],
        $userMap[(int) ($row['created_by'] ?? 0)] ?? $superAdminId,
        $inquiryId,
        null,
        $row['created_at'],
        $row['updated_at'],
    ])).')';
}

foreach ($oldRemarks as $row) {
    $inquiryId = (int) $row['inquiry_id'];
    if (!isset($validInquiryIds[$inquiryId]) || trim((string) $row['message']) === '') {
        continue;
    }

    $streamValues[] = '('.implode(', ', array_map('sqlValue', [
        $row['message'],
        $userMap[(int) ($row['user_id'] ?? 0)] ?? $superAdminId,
        $inquiryId,
        null,
        $row['created_at'],
        $row['updated_at'],
    ])).')';
}

if ($streamValues !== []) {
    $sql[] = 'INSERT INTO `streams` (`'.implode('`, `', $streamColumns).'`) VALUES';
    $sql[] = implode(",\n", $streamValues).';';
    $sql[] = '';
}

$maxInquiryId = max($inquiryIds ?: [0]);
$sql[] = '-- Remap imported history to the live Super Admin if exported user IDs do not exist in the target database.';
$sql[] = "UPDATE `inquiries` SET `assigned_user_id` = (SELECT `id` FROM `users` WHERE `role` = 'super_admin' ORDER BY `id` LIMIT 1) WHERE `assigned_user_id` IS NOT NULL AND `assigned_user_id` NOT IN (SELECT `id` FROM `users`);";
$sql[] = "UPDATE `streams` SET `user_id` = (SELECT `id` FROM `users` WHERE `role` = 'super_admin' ORDER BY `id` LIMIT 1) WHERE `user_id` NOT IN (SELECT `id` FROM `users`);";
$sql[] = '';
$sql[] = 'ALTER TABLE `inquiries` AUTO_INCREMENT = '.($maxInquiryId + 1).';';
$sql[] = 'SET FOREIGN_KEY_CHECKS=1;';
$sql[] = 'COMMIT;';
$sql[] = '';
$sql[] = '-- Summary:';
$sql[] = '-- Inquiries prepared: '.count($oldInquiries);
$sql[] = '-- Follow-up streams prepared: '.count(array_filter($oldFollowUps, fn (array $row): bool => isset($validInquiryIds[(int) $row['inquiry_id']]) && trim((string) $row['response']) !== ''));
$sql[] = '-- Remark streams prepared: '.count(array_filter($oldRemarks, fn (array $row): bool => isset($validInquiryIds[(int) $row['inquiry_id']]) && trim((string) $row['message']) !== ''));

file_put_contents($outPath, implode("\n", $sql));

echo "Generated: {$outPath}\n";
echo 'Old inquiries: '.count($oldInquiries)."\n";
echo 'Old follow ups: '.count($oldFollowUps)."\n";
echo 'Old remarks: '.count($oldRemarks)."\n";
echo 'Mapped old users: '.count($userMap)."\n";

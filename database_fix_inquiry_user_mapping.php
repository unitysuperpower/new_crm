<?php

declare(strict_types=1);

require __DIR__.'/database_import_inquiries.php';

$outPath = __DIR__.DIRECTORY_SEPARATOR.'fix_inquiry_user_mapping.sql';
$map = [
    2 => 103,
    3 => 104,
];

$sql = [];
$sql[] = '-- Fix imported inquiry ownership and stream users.';
$sql[] = '-- Old CRM user 2 = Hira -> new CRM user 103.';
$sql[] = '-- Old CRM user 3 = Suraiya -> new CRM user 104.';
$sql[] = 'START TRANSACTION;';
$sql[] = '';

foreach ($oldInquiries as $row) {
    $oldUserId = (int) ($row['assigned_to'] ?? 0);
    if (!isset($map[$oldUserId])) {
        continue;
    }

    $sql[] = 'UPDATE `inquiries` SET `assigned_user_id` = '.$map[$oldUserId].' WHERE `id` = '.(int) $row['id'].';';
}

$sql[] = '';

foreach ($oldFollowUps as $row) {
    $oldUserId = (int) ($row['created_by'] ?? 0);
    if (!isset($map[$oldUserId]) || trim((string) $row['response']) === '') {
        continue;
    }

    $sql[] = 'UPDATE `streams` SET `user_id` = '.$map[$oldUserId].
        ' WHERE `inquiry_id` = '.(int) $row['inquiry_id'].
        ' AND `created_at` '.($row['created_at'] === null ? 'IS NULL' : '= '.sqlValue($row['created_at'])).
        ' AND `response` = '.sqlValue($row['response']).';';
}

foreach ($oldRemarks as $row) {
    $oldUserId = (int) ($row['user_id'] ?? 0);
    if (!isset($map[$oldUserId]) || trim((string) $row['message']) === '') {
        continue;
    }

    $sql[] = 'UPDATE `streams` SET `user_id` = '.$map[$oldUserId].
        ' WHERE `inquiry_id` = '.(int) $row['inquiry_id'].
        ' AND `created_at` '.($row['created_at'] === null ? 'IS NULL' : '= '.sqlValue($row['created_at'])).
        ' AND `response` = '.sqlValue($row['message']).';';
}

$sql[] = '';
$sql[] = 'COMMIT;';
$sql[] = '';

file_put_contents($outPath, implode("\n", $sql));

echo "Generated: {$outPath}\n";

<?php 
print_r(main());

function main() {
    $name = $_POST['name'];
    $score = $_POST['score'];
    $validate = $_POST['validate'];
    $DO_ANTICHEAT = true;

    // test base64 encoding to avoid executing malicious data
    if (base64_encode(base64_decode($validate, true)) === $validate) {
        if ($DO_ANTICHEAT) {
            $output = [];
            exec('deno run simulator.ts ' . escapeshellarg($validate), $output, $return_var);
            if ($return_var === 0) {
                $rng = $output[0];
                $simScore = $output[1];
                if ($rng === 'true' && $simScore === strval($score) && ($row = add_highscore($name, $score)) >= 0) {
                    return 'success' . PHP_EOL . strval($row);
                }
            }
        } else {
            if (($row = add_highscore($name, $score)) >= 0) {
                error_log($row);
                return 'success' . PHP_EOL . strval($row);
            }
        }
    }
    return 'failure';
}

function add_highscore(string $name, int $score) {
    $final_row = -1;
    if (($hs_fp = fopen('highscores.csv', 'r+')) !== false) {
        $highscores = array();
        $hasAddedScore = false;
        $row = 0;
        while (($raw_entry = fgetcsv($hs_fp)) !== false) {
            error_log(var_export($hasAddedScore, true) . ' ' . $row . ' ' . var_export($raw_entry, true));
            if (!$hasAddedScore && (int)($raw_entry[1]) < $score) {
                $highscores[$row] = array($name, strval($score));
                $hasAddedScore = true;
                $final_row = $row;
                $row++;
            }
            $highscores[$row] = $raw_entry;
            if ($raw_entry[0] === $name) {
                if ($hasAddedScore) {
                    unset($highscores[$row]);
                } else {
                    error_log($row);
                    return $row; // current highscore is higher than new score
                }
            }
            $row++;
        }
        if (!$hasAddedScore) {
            $highscores[$row] = array($name, strval($score));
            $final_row = $row;
        }
        fseek($hs_fp, 0);
        foreach ($highscores as $entry) {
            fputcsv($hs_fp, $entry);
        }
    }
    return $final_row;
}
?>
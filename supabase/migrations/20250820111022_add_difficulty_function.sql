CREATE OR REPLACE FUNCTION update_difficulty_tiers() RETURNS TABLE(
        execution_time_ms INTEGER,
        total_updated INTEGER,
        easy_count INTEGER,
        medium_count INTEGER,
        hard_count INTEGER,
        tier_changes INTEGER
    ) AS $$
DECLARE start_time TIMESTAMP;
end_time TIMESTAMP;
min_sessions INTEGER;
easy_threshold NUMERIC;
medium_threshold NUMERIC;
updated_count INTEGER;
easy_cnt INTEGER;
medium_cnt INTEGER;
hard_cnt INTEGER;
changes_cnt INTEGER;
qualified_fjords_count INTEGER;
BEGIN start_time := clock_timestamp();
SELECT LEAST(
        100,
        GREATEST(
            10,
            PERCENTILE_CONT(0.75) WITHIN GROUP (
                ORDER BY session_count
            )
        )
    )::INTEGER INTO min_sessions
FROM (
        SELECT COUNT(DISTINCT g.session_id) as session_count
        FROM daily_puzzles dp
            JOIN guesses g ON dp.id = g.puzzle_id
        GROUP BY dp.fjord_id
    ) session_counts;
SELECT COUNT(*) INTO qualified_fjords_count
FROM (
        SELECT dp.fjord_id
        FROM daily_puzzles dp
            JOIN guesses g ON dp.id = g.puzzle_id
        GROUP BY dp.fjord_id
        HAVING COUNT(DISTINCT g.session_id) >= min_sessions
    ) qualified_fjords;
IF qualified_fjords_count < 5 THEN easy_threshold := 45;
medium_threshold := 30;
ELSE
SELECT PERCENTILE_CONT(0.67) WITHIN GROUP (
        ORDER BY win_rate
    ),
    PERCENTILE_CONT(0.33) WITHIN GROUP (
        ORDER BY win_rate
    ) INTO easy_threshold,
    medium_threshold
FROM (
        SELECT ROUND(
                COUNT(
                    DISTINCT CASE
                        WHEN g.is_correct THEN g.session_id
                    END
                ) * 100.0 / COUNT(DISTINCT g.session_id),
                1
            ) as win_rate
        FROM daily_puzzles dp
            JOIN guesses g ON dp.id = g.puzzle_id
        GROUP BY dp.fjord_id
        HAVING COUNT(DISTINCT g.session_id) >= min_sessions
    ) qualified_rates;
END IF;
CREATE TEMP TABLE tier_changes_temp AS
SELECT id,
    difficulty_tier as old_tier
FROM fjords
WHERE difficulty_tier IS NOT NULL;
UPDATE fjords
SET difficulty_tier = CASE
        WHEN win_stats.win_rate >= easy_threshold THEN 1
        WHEN win_stats.win_rate >= medium_threshold THEN 2
        ELSE 3
    END
FROM (
        SELECT dp.fjord_id,
            ROUND(
                COUNT(
                    DISTINCT CASE
                        WHEN g.is_correct THEN g.session_id
                    END
                ) * 100.0 / COUNT(DISTINCT g.session_id),
                1
            ) as win_rate
        FROM daily_puzzles dp
            JOIN guesses g ON dp.id = g.puzzle_id
        GROUP BY dp.fjord_id
        HAVING COUNT(DISTINCT g.session_id) >= min_sessions
    ) win_stats
WHERE fjords.id = win_stats.fjord_id;
GET DIAGNOSTICS updated_count = ROW_COUNT;
SELECT COUNT(
        CASE
            WHEN difficulty_tier = 1 THEN 1
        END
    ),
    COUNT(
        CASE
            WHEN difficulty_tier = 2 THEN 1
        END
    ),
    COUNT(
        CASE
            WHEN difficulty_tier = 3 THEN 1
        END
    ) INTO easy_cnt,
    medium_cnt,
    hard_cnt
FROM fjords
WHERE difficulty_tier IS NOT NULL;
SELECT COUNT(*) INTO changes_cnt
FROM fjords f
    JOIN tier_changes_temp t ON f.id = t.id
WHERE f.difficulty_tier != t.old_tier;
end_time := clock_timestamp();
DROP TABLE tier_changes_temp;
RETURN QUERY
SELECT EXTRACT(
        MILLISECONDS
        FROM (end_time - start_time)
    )::INTEGER,
    updated_count,
    easy_cnt,
    medium_cnt,
    hard_cnt,
    changes_cnt;
EXCEPTION
WHEN OTHERS THEN DROP TABLE IF EXISTS tier_changes_temp;
RAISE;
END;
$$ LANGUAGE plpgsql;


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assign_daily_puzzle"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  target_date DATE := CURRENT_DATE;
  next_puzzle_num INTEGER;
  selected_fjord_id INTEGER;
  result_puzzle_num INTEGER;
BEGIN
  SELECT puzzle_number INTO result_puzzle_num 
  FROM daily_puzzles 
  WHERE presented_date = target_date;
  
  IF result_puzzle_num IS NOT NULL THEN
      RETURN result_puzzle_num;
  END IF;
  
  WITH puzzle_numbers AS (
      SELECT puzzle_number FROM daily_puzzles WHERE puzzle_number IS NOT NULL
  ),
  number_series AS (
      SELECT generate_series(1, COALESCE((SELECT MAX(puzzle_number) FROM puzzle_numbers), 0) + 1) AS num
  )
  SELECT COALESCE(MIN(num), 1) INTO next_puzzle_num
  FROM number_series 
  WHERE num NOT IN (SELECT puzzle_number FROM puzzle_numbers);
  
  SELECT fjord_id INTO selected_fjord_id 
  FROM puzzle_queue 
  WHERE scheduled_date = target_date;
  
  IF selected_fjord_id IS NOT NULL THEN
      DELETE FROM puzzle_queue WHERE scheduled_date = target_date;
  ELSE
      SELECT id INTO selected_fjord_id 
      FROM fjords 
      WHERE id NOT IN (SELECT fjord_id FROM daily_puzzles WHERE fjord_id IS NOT NULL)
        AND quarantined = FALSE
        AND wikipedia_url_no IS NOT NULL
      ORDER BY RANDOM() 
      LIMIT 1;
      
      IF selected_fjord_id IS NULL THEN
          SELECT id INTO selected_fjord_id 
          FROM fjords 
          WHERE id NOT IN (SELECT fjord_id FROM daily_puzzles WHERE fjord_id IS NOT NULL)
            AND quarantined = FALSE
          ORDER BY RANDOM() 
          LIMIT 1;
      END IF;
      
      IF selected_fjord_id IS NULL THEN
          SELECT dp.fjord_id INTO selected_fjord_id
          FROM daily_puzzles dp
          JOIN fjords f ON dp.fjord_id = f.id
          WHERE dp.fjord_id IS NOT NULL AND f.quarantined = FALSE
          ORDER BY dp.last_presented_date ASC, RANDOM()
          LIMIT 1;
      END IF;
  END IF;
  
  IF selected_fjord_id IS NULL THEN
      RAISE EXCEPTION 'No fjord could be selected for puzzle assignment';
  END IF;
  
  INSERT INTO daily_puzzles (fjord_id, puzzle_number, presented_date, last_presented_date)
  VALUES (selected_fjord_id, next_puzzle_num, target_date, target_date);
  
  SELECT puzzle_number INTO result_puzzle_num 
  FROM daily_puzzles 
  WHERE presented_date = target_date;
  
  IF result_puzzle_num IS NULL THEN
      RAISE EXCEPTION 'Puzzle insertion failed for unknown reason';
  END IF;
  
  RETURN result_puzzle_num;
  
EXCEPTION
  WHEN unique_violation THEN
      RAISE EXCEPTION 'Failed to create daily puzzle due to constraint violation';
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Unexpected error in assign_daily_puzzle: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."assign_daily_puzzle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_missing_puzzles"("days_back" integer DEFAULT 7) RETURNS TABLE("date_checked" "date", "status" "text", "puzzle_number" integer, "fjord_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_series.date as date_checked,
        CASE 
            WHEN dp.presented_date IS NULL THEN 'MISSING' 
            ELSE 'EXISTS' 
        END as status,
        dp.puzzle_number,
        f.name as fjord_name
    FROM (
        SELECT generate_series(
            CURRENT_DATE - (days_back || ' days')::INTERVAL,
            CURRENT_DATE,
            INTERVAL '1 day'
        )::date as date
    ) date_series
    LEFT JOIN daily_puzzles dp ON dp.presented_date = date_series.date
    LEFT JOIN fjords f ON dp.fjord_id = f.id
    ORDER BY date_series.date DESC;
END;
$$;


ALTER FUNCTION "public"."check_missing_puzzles"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_puzzle_integrity"() RETURNS TABLE("puzzle_number" integer, "count_occurrences" bigint, "status" "text", "dates_used" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH puzzle_stats AS (
        SELECT 
            dp.puzzle_number,
            COUNT(*) as count_occurrences,
            ARRAY_AGG(dp.presented_date::TEXT ORDER BY dp.presented_date) as dates_used
        FROM daily_puzzles dp
        WHERE dp.puzzle_number IS NOT NULL
        GROUP BY dp.puzzle_number
    ),
    expected_numbers AS (
        SELECT generate_series(1, COALESCE((SELECT MAX(puzzle_number) FROM daily_puzzles), 1)) as expected_num
    )
    SELECT 
        COALESCE(ps.puzzle_number, en.expected_num) as puzzle_number,
        COALESCE(ps.count_occurrences, 0) as count_occurrences,
        CASE 
            WHEN ps.count_occurrences IS NULL THEN 'MISSING'
            WHEN ps.count_occurrences > 1 THEN 'DUPLICATE'
            ELSE 'OK'
        END as status,
        COALESCE(ps.dates_used, ARRAY[]::TEXT[]) as dates_used
    FROM expected_numbers en
    FULL OUTER JOIN puzzle_stats ps ON en.expected_num = ps.puzzle_number
    WHERE COALESCE(ps.count_occurrences, 0) != 1
    ORDER BY COALESCE(ps.puzzle_number, en.expected_num);
END;
$$;


ALTER FUNCTION "public"."check_puzzle_integrity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_health_check"() RETURNS TABLE("check_name" "text", "status" "text", "details" "text", "checked_at" timestamp without time zone)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
   today_puzzle INTEGER;
   missing_count INTEGER;
   duplicate_count INTEGER;
   queue_count INTEGER;
   total_fjords INTEGER;
   used_fjords INTEGER;
BEGIN
   SELECT puzzle_number INTO today_puzzle
   FROM daily_puzzles 
   WHERE presented_date = CURRENT_DATE;
   
   SELECT COUNT(*) INTO missing_count
   FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') date_series(date)
   LEFT JOIN daily_puzzles dp ON dp.presented_date = date_series.date::date
   WHERE dp.presented_date IS NULL;
   
   SELECT COUNT(*) INTO duplicate_count
   FROM (
       SELECT puzzle_number 
       FROM daily_puzzles 
       WHERE puzzle_number IS NOT NULL
       GROUP BY puzzle_number 
       HAVING COUNT(*) > 1
   ) duplicates;
   
   SELECT COUNT(*) INTO queue_count
   FROM puzzle_queue
   WHERE scheduled_date >= CURRENT_DATE;
   
   SELECT COUNT(*) INTO total_fjords FROM fjords WHERE quarantined = FALSE;
   SELECT COUNT(DISTINCT fjord_id) INTO used_fjords 
   FROM daily_puzzles 
   WHERE fjord_id IS NOT NULL;
   
   RETURN QUERY VALUES
       ('Today Puzzle', 
        CASE WHEN today_puzzle IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
        CASE WHEN today_puzzle IS NOT NULL THEN 'Puzzle #' || today_puzzle::TEXT ELSE 'No puzzle assigned for today' END,
        NOW()),
       ('Recent Missing', 
        CASE WHEN missing_count = 0 THEN 'OK' ELSE 'WARNING' END,
        missing_count::TEXT || ' missing puzzles in last 7 days',
        NOW()),
       ('Puzzle Duplicates',
        CASE WHEN duplicate_count = 0 THEN 'OK' ELSE 'ERROR' END,
        duplicate_count::TEXT || ' duplicate puzzle numbers found',
        NOW()),
       ('Queue Status',
        CASE WHEN queue_count >= 0 THEN 'OK' ELSE 'INFO' END,
        queue_count::TEXT || ' puzzles queued for future dates',
        NOW()),
       ('Fjord Usage',
        CASE WHEN used_fjords < total_fjords THEN 'OK' ELSE 'INFO' END,
        used_fjords::TEXT || '/' || total_fjords::TEXT || ' fjords used (' || 
        ROUND((used_fjords::NUMERIC / total_fjords::NUMERIC) * 100, 1)::TEXT || '%)',
        NOW());
END;
$$;


ALTER FUNCTION "public"."daily_health_check"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_fjord_puzzle"() RETURNS TABLE("puzzle_id" integer, "puzzle_number" integer, "fjord_id" integer, "fjord_name" "text", "svg_filename" "text", "satellite_filename" "text", "center_lat" numeric, "center_lng" numeric, "wikipedia_url_no" "text", "wikipedia_url_en" "text", "date" "date")
    LANGUAGE "plpgsql"
    AS $$BEGIN   
  RETURN QUERY   
  SELECT      
    dp.id as puzzle_id,     
    dp.puzzle_number,     
    f.id as fjord_id,     
    f.name as fjord_name,     
    f.svg_filename,
    f.satellite_filename,     
    f.center_lat,     
    f.center_lng,     
    f.wikipedia_url_no,     
    f.wikipedia_url_en,     
    dp.presented_date as date   
  FROM daily_puzzles dp   
  JOIN fjords f ON dp.fjord_id = f.id   
  WHERE dp.presented_date = CURRENT_DATE    
  LIMIT 1; 
END;$$;


ALTER FUNCTION "public"."get_daily_fjord_puzzle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_fjord_puzzle_by_number"("puzzle_num" integer) RETURNS TABLE("puzzle_id" integer, "puzzle_number" integer, "fjord_id" integer, "fjord_name" "text", "svg_filename" "text", "satellite_filename" "text", "center_lat" numeric, "center_lng" numeric, "wikipedia_url_no" "text", "wikipedia_url_en" "text", "date" "date")
    LANGUAGE "plpgsql"
    AS $$BEGIN
  RETURN QUERY
  SELECT 
    dp.id as puzzle_id,
    dp.puzzle_number,
    f.id as fjord_id,
    f.name as fjord_name,
    f.svg_filename,
    f.satellite_filename,
    f.center_lat,
    f.center_lng,
    f.wikipedia_url_no,
    f.wikipedia_url_en,
    dp.presented_date as date
  FROM daily_puzzles dp
  JOIN fjords f ON dp.fjord_id = f.id
  WHERE dp.puzzle_number = puzzle_num;
END;$$;


ALTER FUNCTION "public"."get_fjord_puzzle_by_number"("puzzle_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_past_puzzles"() RETURNS TABLE("puzzle_id" integer, "puzzle_number" integer, "fjord_name" "text", "date" "date")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id as puzzle_id,
    dp.puzzle_number,
    f.name as fjord_name,
    dp.presented_date as date
  FROM daily_puzzles dp
  JOIN fjords f ON dp.fjord_id = f.id
  WHERE dp.presented_date < CURRENT_DATE
  ORDER BY dp.puzzle_number DESC;
END;
$$;


ALTER FUNCTION "public"."get_past_puzzles"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."guesses" (
    "id" integer NOT NULL,
    "session_id" "text" NOT NULL,
    "puzzle_id" integer NOT NULL,
    "guessed_fjord_id" integer NOT NULL,
    "is_correct" boolean NOT NULL,
    "distance_km" integer NOT NULL,
    "proximity_percent" integer NOT NULL,
    "attempt_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."guesses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."anonymous_guesses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."anonymous_guesses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."anonymous_guesses_id_seq" OWNED BY "public"."guesses"."id";



CREATE TABLE IF NOT EXISTS "public"."daily_puzzles" (
    "id" integer NOT NULL,
    "presented_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fjord_id" integer,
    "puzzle_number" integer,
    "last_presented_date" "date"
);


ALTER TABLE "public"."daily_puzzles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fjords" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "svg_filename" "text" NOT NULL,
    "center_lat" numeric(10,8) NOT NULL,
    "center_lng" numeric(11,8) NOT NULL,
    "difficulty_tier" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fjordid" "text",
    "wikipedia_url_no" "text",
    "wikipedia_url_en" "text",
    "quarantined" boolean DEFAULT false,
    "quarantine_reason" "text",
    "quarantined_at" timestamp without time zone,
    "satellite_filename" "text",
    "notes" "text",
    CONSTRAINT "fjords_difficulty_tier_check" CHECK (("difficulty_tier" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."fjords" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fjords_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fjords_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fjords_id_seq" OWNED BY "public"."fjords"."id";



CREATE TABLE IF NOT EXISTS "public"."game_sessions" (
    "session_id" "text" NOT NULL,
    "puzzle_id" integer NOT NULL,
    "completed" boolean DEFAULT false,
    "attempts_used" integer DEFAULT 0,
    "won" boolean DEFAULT false,
    "start_time" timestamp with time zone DEFAULT "now"(),
    "end_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "hints" "jsonb" DEFAULT '{"firstLetter": false}'::"jsonb"
);


ALTER TABLE "public"."game_sessions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."puzzle_presentations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."puzzle_presentations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."puzzle_presentations_id_seq" OWNED BY "public"."daily_puzzles"."id";



CREATE TABLE IF NOT EXISTS "public"."puzzle_queue" (
    "id" integer NOT NULL,
    "fjord_id" integer NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'manual'::"text",
    CONSTRAINT "puzzle_queue_scheduled_date_check" CHECK (("scheduled_date" >= CURRENT_DATE))
);


ALTER TABLE "public"."puzzle_queue" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."puzzle_queue_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."puzzle_queue_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."puzzle_queue_id_seq" OWNED BY "public"."puzzle_queue"."id";



ALTER TABLE ONLY "public"."daily_puzzles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."puzzle_presentations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fjords" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fjords_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guesses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."anonymous_guesses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."puzzle_queue" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."puzzle_queue_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guesses"
    ADD CONSTRAINT "anonymous_guesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."daily_puzzles"
    ADD CONSTRAINT "daily_puzzles_presented_date_unique" UNIQUE ("presented_date");



ALTER TABLE ONLY "public"."daily_puzzles"
    ADD CONSTRAINT "daily_puzzles_puzzle_number_key" UNIQUE ("puzzle_number");



ALTER TABLE ONLY "public"."fjords"
    ADD CONSTRAINT "fjords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_puzzles"
    ADD CONSTRAINT "puzzle_presentations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."puzzle_queue"
    ADD CONSTRAINT "puzzle_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."puzzle_queue"
    ADD CONSTRAINT "puzzle_queue_scheduled_date_key" UNIQUE ("scheduled_date");



CREATE INDEX "idx_daily_puzzles_last_presented" ON "public"."daily_puzzles" USING "btree" ("last_presented_date");



CREATE INDEX "idx_puzzle_queue_scheduled_date" ON "public"."puzzle_queue" USING "btree" ("scheduled_date");



ALTER TABLE ONLY "public"."guesses"
    ADD CONSTRAINT "anonymous_guesses_guessed_fjord_id_fkey" FOREIGN KEY ("guessed_fjord_id") REFERENCES "public"."fjords"("id");



ALTER TABLE ONLY "public"."guesses"
    ADD CONSTRAINT "anonymous_guesses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("session_id");



ALTER TABLE ONLY "public"."daily_puzzles"
    ADD CONSTRAINT "daily_puzzles_fjord_id_fkey" FOREIGN KEY ("fjord_id") REFERENCES "public"."fjords"("id");



ALTER TABLE ONLY "public"."puzzle_queue"
    ADD CONSTRAINT "puzzle_queue_fjord_id_fkey" FOREIGN KEY ("fjord_id") REFERENCES "public"."fjords"("id");



CREATE POLICY "Public insert access" ON "public"."game_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert access" ON "public"."guesses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read access" ON "public"."daily_puzzles" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."fjords" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."game_sessions" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."guesses" FOR SELECT USING (true);



CREATE POLICY "Public update access" ON "public"."game_sessions" FOR UPDATE USING (true);



ALTER TABLE "public"."daily_puzzles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fjords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guesses" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."assign_daily_puzzle"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_daily_puzzle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_daily_puzzle"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_missing_puzzles"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_missing_puzzles"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_missing_puzzles"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_puzzle_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_puzzle_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_puzzle_integrity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_health_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_health_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_health_check"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_fjord_puzzle"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_fjord_puzzle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_fjord_puzzle"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_fjord_puzzle_by_number"("puzzle_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_fjord_puzzle_by_number"("puzzle_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_fjord_puzzle_by_number"("puzzle_num" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_past_puzzles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_past_puzzles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_past_puzzles"() TO "service_role";


















GRANT ALL ON TABLE "public"."guesses" TO "anon";
GRANT ALL ON TABLE "public"."guesses" TO "authenticated";
GRANT ALL ON TABLE "public"."guesses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."anonymous_guesses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."anonymous_guesses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."anonymous_guesses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."daily_puzzles" TO "anon";
GRANT ALL ON TABLE "public"."daily_puzzles" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_puzzles" TO "service_role";



GRANT ALL ON TABLE "public"."fjords" TO "anon";
GRANT ALL ON TABLE "public"."fjords" TO "authenticated";
GRANT ALL ON TABLE "public"."fjords" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fjords_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fjords_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fjords_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."game_sessions" TO "anon";
GRANT ALL ON TABLE "public"."game_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."puzzle_presentations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."puzzle_presentations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."puzzle_presentations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."puzzle_queue" TO "anon";
GRANT ALL ON TABLE "public"."puzzle_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."puzzle_queue" TO "service_role";



GRANT ALL ON SEQUENCE "public"."puzzle_queue_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."puzzle_queue_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."puzzle_queue_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

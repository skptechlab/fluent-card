-- Insert test teacher with specific ID for fluent-card testing
-- Run this SQL to create the teacher record with ID 49550370003760

-- Note: MySQL doesn't allow setting AUTO_INCREMENT values directly in standard INSERT
-- We need to temporarily disable the AUTO_INCREMENT behavior

-- Method 1: Insert and then update the ID (if your MySQL version allows)
INSERT INTO players (username, email, total_wins, total_losses, win_streak, created_at, updated_at) 
VALUES ('TestTeacher', 'teacher@test.edu', 0, 0, 0, NOW(), NOW());

-- Get the last inserted ID and then update it
-- You'll need to run this manually and replace <LAST_ID> with the actual ID that was created
-- UPDATE players SET id = 49550370003760 WHERE id = <LAST_ID>;

-- Method 2: Alternative - Use a simpler ID for testing
-- Instead of the long ID, you could use a simple ID like 1, 2, 3, etc.
-- INSERT INTO players (id, username, email, total_wins, total_losses, win_streak, created_at, updated_at) 
-- VALUES (1, 'TestTeacher', 'teacher@test.edu', 0, 0, 0, NOW(), NOW());

-- Method 3: Check if the teacher already exists
SELECT * FROM players WHERE username = 'TestTeacher';

-- If you want to clean up and start fresh:
-- DELETE FROM players WHERE username = 'TestTeacher';
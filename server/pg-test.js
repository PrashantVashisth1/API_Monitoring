import pg from './src/shared/config/postgres.js';
async function run() {
  await pg.testConnection();
  
  try {
    await pg.query('ALTER TABLE endpoint_metrics ALTER COLUMN time_bucket TYPE timestamp without time zone USING time_bucket AT TIME ZONE \'UTC\'');
    console.log('Successfully reverted column type.');
  } catch (err) {
    console.error('Failed to revert', err.message);
  }
  process.exit(0);
}
run();

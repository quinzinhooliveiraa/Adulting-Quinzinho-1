const { Client } = require('pg');

const OLD_DB = "postgresql://neondb_owner:npg_aK0tmxvqrW4I@ep-late-mud-anfrf7yv-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const NEW_DB = process.env.NEON_DATABASE_URL;

if (!NEW_DB) {
  console.error('NEON_DATABASE_URL não está definido');
  process.exit(1);
}

async function migrate() {
  const oldDb = new Client({ connectionString: OLD_DB });
  const newDb = new Client({ connectionString: NEW_DB });

  await oldDb.connect();
  await newDb.connect();
  console.log('Ligado a ambas as bases de dados');

  const tables = [
    'users',
    'book_purchases',
    'journal_entries',
    'mood_checkins',
    'journey_progress',
    'journey_reports',
    'book_highlights',
    'push_subscriptions',
    'feedback_tickets',
    'coupon_uses',
    'coupons',
    'user_events',
  ];

  for (const table of tables) {
    try {
      const { rows } = await oldDb.query(`SELECT * FROM ${table}`);
      if (rows.length === 0) {
        console.log(`[${table}] Vazio — ignorado`);
        continue;
      }

      const cols = Object.keys(rows[0]);
      let inserted = 0;
      let skipped = 0;

      for (const row of rows) {
        const values = cols.map(c => row[c]);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = cols.map(c => `"${c}"`).join(', ');

        try {
          await newDb.query(
            `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (e) {
          skipped++;
        }
      }

      console.log(`[${table}] ${inserted} inseridos, ${skipped} ignorados de ${rows.length}`);
    } catch (e) {
      console.log(`[${table}] ERRO: ${e.message}`);
    }
  }

  await oldDb.end();
  await newDb.end();
  console.log('\nMigração concluída!');
}

migrate().catch(e => {
  console.error('Erro fatal:', e.message);
  process.exit(1);
});

import { getDb } from './index.js';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  const db = await getDb();
  console.log('Running database schema migrations...');

  const statements = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      avatar_url TEXT,
      bio TEXT,
      institution VARCHAR(150),
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Categories table
    `CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      icon VARCHAR(50),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Tags table
    `CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL UNIQUE,
      slug VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Resources table
    `CREATE TABLE IF NOT EXISTS resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      subject VARCHAR(100) NOT NULL,
      academic_level VARCHAR(50) NOT NULL,
      institution VARCHAR(150),
      visibility VARCHAR(20) NOT NULL DEFAULT 'public',
      status VARCHAR(20) NOT NULL DEFAULT 'approved',
      download_count INTEGER NOT NULL DEFAULT 0,
      bookmark_count INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      thumbnail_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Resource Files table
    `CREATE TABLE IF NOT EXISTS resource_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      original_name VARCHAR(255) NOT NULL,
      storage_key TEXT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      file_extension VARCHAR(20) NOT NULL,
      checksum_sha256 VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Resource Tags join table
    `CREATE TABLE IF NOT EXISTS resource_tags (
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (resource_id, tag_id)
    );`,

    // Bookmarks table
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, resource_id)
    );`,

    // Collections table
    `CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Collection Items table
    `CREATE TABLE IF NOT EXISTS collection_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(collection_id, resource_id)
    );`,

    // Download Events table
    `CREATE TABLE IF NOT EXISTS download_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Reports table
    `CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      reason VARCHAR(50) NOT NULL,
      details TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Moderation Actions table
    `CREATE TABLE IF NOT EXISTS moderation_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID NOT NULL,
      action VARCHAR(50) NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      link_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Audit Logs table
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID,
      metadata TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Performance Indexes
    `CREATE INDEX IF NOT EXISTS idx_resources_status_visibility ON resources (status, visibility);`,
    `CREATE INDEX IF NOT EXISTS idx_resources_category ON resources (category_id);`,
    `CREATE INDEX IF NOT EXISTS idx_resources_user ON resources (user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources (created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_resources_downloads ON resources (download_count DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_collections_user ON collections (user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_download_events_resource ON download_events (resource_id);`,
  ];

  for (const stmt of statements) {
    await db.execute(sql.raw(stmt));
  }

  console.log('Database migrations executed successfully!');
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

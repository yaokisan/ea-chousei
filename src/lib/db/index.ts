import { sql } from '@vercel/postgres';

export { sql };

// データベース初期化
export async function initializeDatabase() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 60,
        deadline TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Time slots table
    await sql`
      CREATE TABLE IF NOT EXISTS time_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(event_id, date, start_time, end_time)
      )
    `;

    // Respondents table
    await sql`
      CREATE TABLE IF NOT EXISTS respondents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Responses table
    await sql`
      CREATE TABLE IF NOT EXISTS responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        respondent_id UUID NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
        time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
        status VARCHAR(10) NOT NULL CHECK (status IN ('ok', 'ng', 'maybe')),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(respondent_id, time_slot_id)
      )
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_time_slots_event_id ON time_slots(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_respondents_event_id ON respondents(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_responses_respondent_id ON responses(respondent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_responses_time_slot_id ON responses(time_slot_id)`;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return { success: false, error };
  }
}

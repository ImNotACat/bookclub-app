-- Current Book Club Book table
-- Only one book can be the current book club book at a time
CREATE TABLE IF NOT EXISTS current_book_club_book (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_current_book_club_book_book_id ON current_book_club_book(book_id);

-- Enable Row Level Security (RLS)
ALTER TABLE current_book_club_book ENABLE ROW LEVEL SECURITY;

-- RLS Policies for current_book_club_book
-- Everyone can view the current book
CREATE POLICY "Current book club book is viewable by everyone" ON current_book_club_book
  FOR SELECT USING (true);

-- Authenticated users can set the current book
CREATE POLICY "Authenticated users can set current book" ON current_book_club_book
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update the current book
CREATE POLICY "Authenticated users can update current book" ON current_book_club_book
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can delete the current book
CREATE POLICY "Authenticated users can delete current book" ON current_book_club_book
  FOR DELETE USING (auth.role() = 'authenticated');

-- Function to ensure only one current book exists
CREATE OR REPLACE FUNCTION ensure_single_current_book()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any existing current book before inserting/updating
  DELETE FROM current_book_club_book WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to ensure only one current book exists
CREATE TRIGGER ensure_single_current_book_trigger
  BEFORE INSERT OR UPDATE ON current_book_club_book
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_book();

-- Book Club Suggestions table
CREATE TABLE IF NOT EXISTS book_club_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, suggested_by) -- One suggestion per user per book
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_book_club_suggestions_book_id ON book_club_suggestions(book_id);
CREATE INDEX IF NOT EXISTS idx_book_club_suggestions_suggested_by ON book_club_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_book_club_suggestions_created_at ON book_club_suggestions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE book_club_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_club_suggestions
-- Everyone can view suggestions
CREATE POLICY "Book club suggestions are viewable by everyone" ON book_club_suggestions
  FOR SELECT USING (true);

-- Authenticated users can suggest books
CREATE POLICY "Authenticated users can suggest books" ON book_club_suggestions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own suggestions
CREATE POLICY "Users can delete their own suggestions" ON book_club_suggestions
  FOR DELETE USING (auth.uid() = suggested_by);

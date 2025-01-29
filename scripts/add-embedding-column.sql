-- Add embedding column if it doesn't exist
alter table knowledge_base_articles 
add column if not exists content_embedding vector(1536),
add column if not exists last_embedding_update timestamptz;

-- Create an index for similarity search
create index if not exists knowledge_base_articles_embedding_idx 
on knowledge_base_articles 
using ivfflat (content_embedding vector_cosine_ops)
with (lists = 100); 
-- Enable the vector extension if not already enabled
create extension if not exists vector;

-- Function to match articles based on embedding similarity
create or replace function match_articles(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    title,
    content,
    1 - (content_embedding <=> query_embedding) as similarity
  from knowledge_base_articles
  where 1 - (content_embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$; 
-- Enable the vector extension
create extension if not exists vector;

-- Add vector column and metrics columns to knowledge_base_articles
alter table knowledge_base_articles 
add column if not exists content_embedding vector(3072),  -- For text-embedding-3-large
add column if not exists view_count integer default 0,
add column if not exists suggestion_count integer default 0,
add column if not exists click_through_count integer default 0,
add column if not exists resolution_count integer default 0,
add column if not exists helpful_votes integer default 0,
add column if not exists unhelpful_votes integer default 0,
add column if not exists last_embedding_update timestamp with time zone;

-- Create a function to update article metrics
create or replace function increment_article_metric(
  article_id uuid,
  metric text
) returns void as $$
begin
  case metric
    when 'view' then
      update knowledge_base_articles
      set view_count = view_count + 1
      where id = article_id;
    when 'suggestion' then
      update knowledge_base_articles
      set suggestion_count = suggestion_count + 1
      where id = article_id;
    when 'click_through' then
      update knowledge_base_articles
      set click_through_count = click_through_count + 1
      where id = article_id;
    when 'resolution' then
      update knowledge_base_articles
      set resolution_count = resolution_count + 1
      where id = article_id;
    when 'helpful' then
      update knowledge_base_articles
      set helpful_votes = helpful_votes + 1
      where id = article_id;
    when 'unhelpful' then
      update knowledge_base_articles
      set unhelpful_votes = unhelpful_votes + 1
      where id = article_id;
  end case;
end;
$$ language plpgsql security definer;

-- Create an index on the vector column
create index if not exists knowledge_base_articles_embedding_idx
  on knowledge_base_articles
  using ivfflat (content_embedding vector_cosine_ops)
  with (lists = 100);

-- Function to find similar articles
create or replace function match_articles(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  tags text[],
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    content,
    tags,
    1 - (content_embedding <=> query_embedding) as similarity
  from knowledge_base_articles
  where 1 - (content_embedding <=> query_embedding) > match_threshold
  order by content_embedding <=> query_embedding
  limit match_count;
$$; 